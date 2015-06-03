
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": true,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

var basicAuthHeader = null;

var app = angular.module('myApp', ['base64', 'ui.bootstrap', 'ngAnimate', 'ui.grid', 'ui.grid.edit', 'ui.grid.resizeColumns', 'ngIdle', 'pascalprecht.translate']);

app.controller('userController',
    function($scope, $http, $timeout, $base64, uiGridConstants, $log, Idle, Keepalive, $modal, $translate, $translatePartialLoader) {

        $scope.currentLanguage = null; //"de";
        $scope.languageFlagUrl = "images/flagOfGermany.svg";
        $scope.selectLanguage = function() {

            if($scope.currentLanguage == "de") {
                $scope.currentLanguage = "en";
                $scope.languageFlagUrl = "images/flagOfTheUnitedKingdom.svg";
            }
            else {
                $scope.currentLanguage = "de"
                $scope.languageFlagUrl = "images/flagOfGermany.svg";
            }

            $translatePartialLoader.addPart('all');
            $translate.use($scope.currentLanguage);
        }

        $timeout(function() {
            $scope.selectLanguage();
        });

        $scope.players = [];
        $scope.roles = [];
        $scope.usernameForLogin = null;
        $scope.passwordForLogin = null;

        $scope.checkIfLoggedIn = function()
        {
            return !(($scope.roles == null || $scope.roles.length < 1) || $scope.usernameForLogin == null || $scope.passwordForLogin == null);
        }

        $scope.gridOptions = {
            enableSorting: true,
            enableFiltering: true,
            showGridFooter: false,
            showColumnFooter: false,
            columnDefs: [
                {name: 'Firstname', field: 'firstname', enableCellEdit: false, aggregationType: uiGridConstants.aggregationTypes.count},
                {name: 'Lastname',  field: 'lastname', enableCellEdit: false}
            ]
        };
        $scope.gridOptions.data = $scope.players;

        $scope.login = function() {

            $log.debug($scope.usernameForLogin);
            $log.debug($scope.passwordForLogin);

            basicAuthHeader = 'Basic ' + $base64.encode($scope.usernameForLogin + ':' + $scope.passwordForLogin);
            $log.log("created basic auth header: " + basicAuthHeader);
            $log.log("requesting roles...");
            $http.post("rest/relation/userAndRole", {"username":$scope.usernameForLogin, "password":$scope.passwordForLogin})
            .success(function (response) {
                console.log('Roles loading response: ', response);
                $scope.roles = response;

                $scope.startIdleWatcher();

            })
            .error(function(data, status, headers, config, statusText) {
            	toastr.error(data, "Error");
            });
        }

        $scope.logout = function() {

            $scope.usernameForLogin = null;
            $scope.passwordForLogin = null;
            $scope.stopIdleWatcher();
            $log.log("removed username and password from memory");
            $scope.roles = [];
            $log.log("removed roles from memory");
            basicAuthHeader = null;
            $log.log("deleted basic auth header: " + basicAuthHeader);

            toastr.warning("You have been logged out!", "Logout");
        }

        $scope.addPlayer = function () {

        	$http.defaults.headers.common.Authorization = basicAuthHeader;

            $http.post('rest/entity/player', {
                'user'   : { 'username'  : $scope.user.username,
                             'password'  : $scope.user.password },
                'player' : { 'firstname' : $scope.player.firstname,
                             'lastname'  : $scope.player.lastname }
            }).
            success(function(data, status, headers, config) {
            	toastr.success(data.player.firstname + " " + data.player.lastname + "<br />" + data.user.username + " (" + data.user.id + ")",
                               "Player creation successful.");
            }).
            error(function(data, status, headers, config, statusText) {
            	toastr.error(data, "Error");
            });
        };

        // SOCKETS!!! YEHA!
        
        var request = {
            // todo: reading the location from string is a bad idea! there will be signs like that:#
            url: document.location.toString() + 'rest/entity/player/websocket',
            contentType: "application/json",
            logLevel: 'debug',
            transport: 'websocket',
            trackMessageLength: true,
            fallbackTransport: 'long-polling'
        };

        request.onOpen = function (response) {
            console.log('Connected using ' + response.transport);
        };

        request.onMessage = function (response) {
            var message = response.responseBody;
            try {
                var json = atmosphere.util.parseJSON(message);
            } catch (e) {
                console.log('Error when parsing JSON: ', message);
                return;
            }

            console.log('Message OK. Json: ', json);
            $timeout(function() {$scope.players.push(json) });
        }

        request.onClose = function (response) {
            console.log('Disconnected.');
        }

        request.onError = function (response) {
            console.log('Error.');
        };

        atmosphere.subscribe(request);
        //var socket = atmosphere;
        //var subSocket = socket.subscribe(request);

        $http.get("rest/entity/player")
        .success(function (response) {
            console.log('Initial loading response: ', response);
            $scope.players = response;
            $scope.gridOptions.data = $scope.players;
        })
        .error(function(data, status, headers, config, statusText) {
        	toastr.error(data, "Error");
        });



        $scope.started = false;

        function closeModals() {
            if ($scope.warning) {
                $scope.warning.close();
                $scope.warning = null;
            }

            if ($scope.timedout) {
                $scope.timedout.close();
                $scope.timedout = null;
            }
        }

        $scope.$on('IdleStart', function() {
            closeModals();

            $scope.warning = $modal.open({
                templateUrl: 'warning-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $scope.$on('IdleEnd', function() {
            closeModals();
        });

        $scope.$on('IdleTimeout', function() {
            $log.debug("Logging out!")
            $scope.logout();
            closeModals();/*
            $scope.timedout = $modal.open({
                templateUrl: 'timedout-dialog.html',
                windowClass: 'modal-danger'
            });*/
        });

        $scope.startIdleWatcher = function() {
            $log.debug("Starting idle handler!")
            closeModals();
            Idle.watch();
            $scope.started = true;
        };

        $scope.stopIdleWatcher = function() {
            $log.debug("Stopping idle handler!")
            closeModals();
            Idle.unwatch();
            $scope.started = false;

        };
    })
    .config(function(IdleProvider, KeepaliveProvider) {
        IdleProvider.idle(5);
        IdleProvider.timeout(5);
        KeepaliveProvider.interval(10);
    })

    .config(function($translateProvider, $translatePartialLoaderProvider ) {
        $translateProvider.useLoader(
            '$translatePartialLoader',
            { urlTemplate: '/js/i18n/locales/{lang}/{part}.json' }
        )
        $translateProvider.preferredLanguage('de');
    })

    .value('language', 'de')
    .run(function($rootScope,  $translate, $translatePartialLoader) {
        $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
            $translate.refresh();
        });
    })
;

