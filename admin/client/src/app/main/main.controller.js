(function(angular) {
  'use strict';

  angular
    .module('othelloLeague')
    .controller('MainController', mainController);

  mainController.$inject = ['$log', 'mainSocket'];

  /** @ngInject */
  function mainController($log, mainSocket) {
    var vm = this;

    vm.waitingPlayer = false;

    // When the connection succeeded
    mainSocket.on('connectionSucceed', function(data){
      playerListChanged(data.players);
      gameListChanged(data.games);
    });

    // When the player list changed
    mainSocket.on('playerListChanged', playerListChanged);

    // When the game list changed
    mainSocket.on('gameListChanged', gameListChanged);

    function playerListChanged(data){
      vm.players = data;
      vm.waitingPlayer = false;
    }

    function gameListChanged(data){
      vm.games = data;
    }

    vm.getStatus = function(player){
      if(player.available){
        if(vm.waitingPlayer){
          if(vm.waitingPlayer.name === player.name)
            return 'waiting';

          return 'getme';
        }

        return 'available';
      }
      return 'playing';
    }

    vm.clearWaiting = function(){
      vm.waitingPlayer = false;
    }

    vm.waitForMatch = function(player){
      vm.waitingPlayer = player;
    }

    vm.setForMatch = function(player){
      mainSocket.emit('startSeries', [vm.waitingPlayer, player]);
    }

    vm.startLeague = function(){
      mainSocket.emit('startLeague');
    }
  }
})(angular);
