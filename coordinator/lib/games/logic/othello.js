var gameConstants = require('../constants'),
    gameRandom = require('../../utils/gameRandom');

function Othello(size){
  this.size = size - size % 2; // Convert to even
}

Othello.prototype.play = function(game, player, movement, nextGameCb, finishGameCb, errorCb){

  // TODO: take size into account (mostly for validation purposes)

  // TODO: ---------------------------------------------------------------------

  // Game logic

    // TODO: MUST MUST MUST UPDATE THE FOLLOWING

    // this.board = result.board;
    // this.extra = result.extra;
    // this.currentTurn = result.currentTurn;
    // this.status = result.status;
    // this.winner = result.win

  // Termination evaluation

  // Turn callbacks

  // ---------------------------------------------------------------------------

  if(game.movementNumber > 2){

    // Calculate random winner
    var rWin = parseInt(Math.floor(Math.random() * 2));

    // Calculate winner and loser
    game.winner = rWin === 0 ? game.player_1 : game.player_2;
    game.loser = rWin === 0 ? game.player_2 : game.player_1;

    // Update wins and loses
    game.winner.wins++;
    game.loser.loses++;

    // Set game as finished
    game.status = gameConstants.STATUS.finished;

    // Finish callback
    finishGameCb(game, game.winner)

  }
  else{

    // Augment movement number
    game.movementNumber++;

    // If player 1
    if(player.id === game.player_1.id){

      // Update new current turn
      game.currentTurn = gameConstants.PLAYER_2_TURN_ID;

      // Ask player 2 to play
      nextGameCb(game, game.player_2);
    }

    // If player 2
    else if(player.id === game.player_2.id){

      // Update new current turn
      game.currentTurn = gameConstants.PLAYER_1_TURN_ID;

      // Ask player 1 to play
      nextGameCb(game, game.player_1);
    }

    else{

      // TODO: error! player playing is neither of the game's players
      errorCb({
        status: 404,
        message: 'Player not registered in game'
      });
    }
  }
}

Othello.prototype.getStartingBoard = function(player_1Turn){

  // TODO: take size into account
  if(player_1Turn){
    return [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, gameConstants.PLAYER_2_TURN_ID, gameConstants.PLAYER_1_TURN_ID, 0, 0, 0,
      0, 0, 0, gameConstants.PLAYER_1_TURN_ID, gameConstants.PLAYER_2_TURN_ID, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ];
  }

  return [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, gameConstants.PLAYER_1_TURN_ID, gameConstants.PLAYER_2_TURN_ID, 0, 0, 0,
    0, 0, 0, gameConstants.PLAYER_2_TURN_ID, gameConstants.PLAYER_1_TURN_ID, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ];
}

module.exports = Othello;