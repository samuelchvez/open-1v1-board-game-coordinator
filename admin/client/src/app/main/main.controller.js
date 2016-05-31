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

    // Set tournament as waiting
    vm.tournament = { status: 'waiting' };

    // When the user is connected
    mainSocket.on('connect', function(){

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
    mainSocket.on('tournament_status_changed', tournamentStatusChanged);

    function playerListChanged(data){
      vm.players = data;
      vm.waitingPlayer = false;
    }

    function gameListChanged(data){
      vm.games = data;
    }

    // TODO: implement this
    function tournamentStatusChanged(data){
      vm.tournament.status = data.status;
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

    vm.startTournament = function(){
      mainSocket.emit('start_tournament', tournamentID);
    }

    vm.resetTournament = function(){
      mainSocket.emit('reset_tournament', tournamentID);
    }

    vm.unstuckGame = function(gameID, turnID){
      mainSocket.emit('unstuck_game', {
        tournament_id: tournamentID,
        game_id: gameID,
        winner_turn_id: turnID
      });
    }
  }
})(angular);
