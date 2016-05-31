(function() {
  'use strict';

  angular
    .module('othelloClient')
    .controller('MainController', mainController);

  mainController.$inject = ['$log', 'socketFactory'];

  function mainController($log, socketFactory) {
    var vm = this,
        N = 8,
        coordinatorIP = "http://" + prompt("Coordinator IP:") + ":3000",
        tournamentID = parseInt(prompt("Tournament ID:")),
        mainSocket = socketFactory({
          ioSocket: io.connect(coordinatorIP, {'sync disconnect on unload': true})
        });

    // Player not ready
    vm.ready = false;
    vm.userName = prompt("Username:");
    vm.winnerTurnID = undefined;

    // Reset board
    resetBoard(vm, N);

    vm.play = function(position){
      if(vm.ready && vm.boardTiles[position].color === 0){

        // Set player as not ready
        vm.ready = false;

        vm.boardTiles[position].color = 3;

        // Make movement
        mainSocket.emit('play', {
          tournament_id: tournamentID,
          player_turn_id: vm.currentTurnID,
          game_id: vm.currentGameID,
          movement: position
        });
      }
    }

    mainSocket.on('connect', function(){

      // Sign in signal
      mainSocket.emit('signin', {
        user_name: vm.userName,
        tournament_id: tournamentID,
        user_role: 'player'
      });
    });

    // Ready to play signal
    mainSocket.on('ready', function(data){
      vm.gameFinished = false;
      vm.currentGameID = data.game_id;
      vm.currentTurnID = data.player_turn_id;
      vm.boardTiles = transformBoard(data.board);

      // Set client as hearing click events
      vm.ready = true;
    });

    // Game finish signal
    mainSocket.on('finish', function(data){

      // Save data
      vm.currentGameID = data.game_id;
      vm.currentTurnID = data.player_turn_id;
      vm.winnerTurnID = data.winner_turn_id;
      vm.boardTiles = transformBoard(data.board);

      // Set game as finished
      vm.gameFinished = true;
    });

    vm.setReady = function(){

      // If the game is finished
      if(vm.gameFinished){

        // Set ready
        mainSocket.emit('player_ready', {
          tournament_id: tournamentID,
          game_id: vm.currentGameID,
          player_turn_id: vm.currentTurnID
        });

        // Mark as new game
        vm.gameFinished = false;

        // Reset board
        resetBoard(vm, N);
      }
    }
  }

  function resetBoard(vm, N){
    var board = [];
    for(var i = 0; i < N * N; i++){board[i] = 0;}
    vm.boardTiles = transformBoard(board);
  }

  function transformBoard(board){
    var result = [];

    for(var i = 0; i < board.length; i++){
      result[i] = {
        id: i,
        color: board[i]
      }
    }

    return result;
  }

  // function randInt(a, b){
  //   return parseInt(Math.floor(Math.random() * (b - a) + b));
  // }
})();
