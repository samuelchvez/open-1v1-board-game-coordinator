(function(angular) {
  'use strict';

  angular
    .module('othelloLeague')
    .controller('MainController', mainController);

  mainController.$inject = ['$log', 'mainSocket'];

  /** @ngInject */
  function mainController($log, mainSocket) {
    var vm = this,
        tournamentID = 142857;

    // When the user is connected
    mainSocket.on('connect', function(){
      console.log("Conectado.");

      mainSocket.emit('signin', {
        name:'TournamentAdministrator',
        tournament_id: tournamentID,
        user_role: 'admin'
      });

    });

    // When the player list changed
    mainSocket.on('player_list_changed', playerListChanged);

    // When the game list changed
    mainSocket.on('game_list_changed', gameListChanged);

    // When the tournament has ended
    mainSocket.on('league_finished', leagueFinished);

    function playerListChanged(data){
      vm.players = data;
      vm.waitingPlayer = false;
    }

    function gameListChanged(data){
      vm.games = data;
    }

    // TODO: implement this
    function leagueFinished(){}

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

    vm.startTournament = function(){
      mainSocket.emit('start_tournament', 142857);
    }
  }
})(angular);
