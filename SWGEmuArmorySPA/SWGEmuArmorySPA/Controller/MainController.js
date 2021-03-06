﻿/// <reference path="../../lib/angular-1.2.10/angular.js" />
/// <reference path="../../lib/angular-1.2.10/angular-resource.js" />
/// <reference path="../../lib/angular-local-storage/angular-local-storage.js" />
/// <reference path="../Service/AccountService.js" />

var module = angular.module('SWGEmuArmorySPA.Controller');

module.controller('mainController', ['$scope', '$rootScope', '$location', '$window', '$http', 'localStorageService', 'TokenService', 'AccountService', 'CharacterDetailsService', 'StructureDetailsService', 'endpoints',
    function ($scope, $rootScope, $location, $window, $http, localStorageService, tokenService, accountService, characterDetailsService, structureDetailsService, endpoints) {

        $rootScope.endpoints = endpoints;

    $rootScope.loggedIn = false;

    $scope.getAccountInfoFromToken = function (token) {

        var handleTokenResponse = function (data) {
            if (data.status == 302 || data.status == 200) {
                var owner = data.data.owner;

                $http.defaults.headers.common.Authorization = token.token_type + ' ' + token.access_token;

                    accountService.getAccountByAccountID(owner.id).then(function (data) {
                        $rootScope.accounts = data.data[0];

                $rootScope.selectedCharacter = null;
                $rootScope.loggedIn = true;

                var previouslySelectedCharacter = localStorageService.get('selectedCharacterOID');
                if (previouslySelectedCharacter != null) {
                    
                    angular.forEach($rootScope.accounts.characters, function (character) {
                        if (character.character_oid == previouslySelectedCharacter) {
                            $rootScope.selectedCharacter = character;
                            return;
                        }
                    });
                }
                    });
            }

        };

        tokenService.getTokenInfo(token).then(handleTokenResponse, handleTokenResponse);
    };

    

    $rootScope.$watch('selectedCharacter', function (newValue, oldValue) {

        if (angular.isUndefined(newValue.character_oid)) {
            $rootScope.characterDetails = null;
        }
        else {
            localStorageService.add('selectedCharacterOID', newValue.character_oid);
            characterDetailsService.getCharacterDetailsByOID(newValue.character_oid).then(function (data) {
                $rootScope.characterDetails = data.data[0];
            });
        }
    });

    $rootScope.$watch('selectedStructure', function (newVal, oldVal) {
        if (angular.isUndefined(newVal) || angular.isUndefined(newVal.object_id)) {
            $rootScope.selectedStructureDetails = null;
        }
        else {
            structureDetailsService.getDetailsForStructure(newVal.object_id, $rootScope.selectedCharacter.character_oid)
                .then(function (data) {
                    $rootScope.selectedStructureDetails = data.data;
                });
        }

    });

    $rootScope.$watch('oauthToken', function (newVal, oldVal) {
        if (angular.isDefined(newVal)) {
            localStorageService.add('oauthToken', newVal);
            $scope.getAccountInfoFromToken(newVal);
        }
    });
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    $scope.selectCharacter = function (selectedCharacter) {
        $rootScope.selectedCharacter = selectedCharacter;
    };

    $scope.logout = function () {

        var token = localStorageService.get('oauthToken');
        
        localStorageService.clearAll();
            $window.location = endpoints.oauth2LogoutURL + (token != null ? token.access_token : '');
    };

    if ($location.path().indexOf('authenticate') == -1) {
        //some initialization
        var oauthToken = localStorageService.get('oauthToken');
        if (oauthToken == null) {
            $rootScope.loggedIn = false;
        }
        else {
            $scope.getAccountInfoFromToken(oauthToken);
        }
    }


}]);
