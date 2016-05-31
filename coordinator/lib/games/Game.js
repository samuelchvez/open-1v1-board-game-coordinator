var gameRandom = require('../utils/gameRandom'),
    gameConstants = require('./constants');

function Game(logic, player_1, player_2){
  this.id = gameRandom.getID();
  this.player_1 = player_1;
  this.player_2 = player_2;
  this.board = logic.getStartingBoard();
  this.extra = {};
  this.currentTurn = gameConstants.PLAYER_1_TURN_ID;
  this.movementNumber = 0;

  // Hidden
  this.ongoingGames = undefined;
  this.logic = logic;
  this.status = gameConstants.STATUS.programmed;
  this.is_rematch = false;
  this.rematchReady_1 = false;
  this.rematchReady_2 = false;
  this.date_time = new Date();
  this.series = 0;
  this.winner = false;
  this.rematch_id = 0;
}

Game.prototype.play = function(player, movement, nextCb, finishCb, errorCb){

  // Call this game's logic
  this.logic.play(this, player, movement, nextCb, finishCb, errorCb);
}

Game.prototype.start = function(){

  // Mark game as ongoing
  this.status = gameConstants.STATUS.ongoing;

  // Set starting time as now
  this.date_time = new Date();

  // Set player as unavailable
  this.player_1.available = false;
  this.player_2.available = false;
}

module.exports = Game;