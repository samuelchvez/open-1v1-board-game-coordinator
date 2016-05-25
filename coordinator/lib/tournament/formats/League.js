var Game = require('../../games/Game'),
    tournamentConstants = require('../constants'),
    gameRandom = require('../../utils/gameRandom'),
    gameConstants = require('../../games/constants');

function League(id, setSize, gameLogic){
  this.id = id || gameRandom.getID();
  this.setSize = setSize;
  this.playerTable = {};
  this.roundRobinGames = [];
  this.ongoingGames = {};
  this.status = tournamentConstants.STATUS.waiting;
  this.gameLogic = gameLogic;
}

League.prototype.registerPlayer = function(player, successCb, failureCb){

  // If the league is ready to register players
  if(this.status === tournamentConstants.STATUS.waiting){

    // If the player is not already registered for this league
    if(!(player.id in this.playerTable)){

      // Register
      this.playerTable[player.id] = player;

      // TODO: save in DB

      // Notify successful register
      successCb({
        status: 200,
        message: 'Player successfully registered in league ' + this.id
      });
    }
    else{
      successCb({
        status: 202,
        message: 'Player already registered in league ' + this.id
      });
    }
  }
  else{
    failureCb({
      status: 400,
      message: 'League is not waiting connection'
    });
  }
}

League.prototype.start = function(cb){

  // Clear roundRobin
  this.roundRobinGames = [];

  // Generate round robin matches
  var playerIDs = Object.keys(this.playerTable),
      lastGame,
      newGame;

  // From the first player to the last
  for(var i = 0; i < playerIDs.length; i++){

    // From the next player and go on
    for(var j = i + 1; j < playerIDs.length; j++){

      for(var k = 0; k < this.setSize; k++){

        // Remember last game
        lastGame = newGame;

        // Generate new game
        newGame = new Game(
          this.gameLogic,
          this.playerTable[playerIDs[i]],
          this.playerTable[playerIDs[j]],
          k % 2 === 0);

        newGame.series = k;

        if(k > 0){
          newGame.is_rematch = true;
          lastGame.rematch_id = newGame.id;
        }

        // Add new game to the round robin table
        this.roundRobinGames.push(newGame);
      }
    }
  }

  // Callback
  cb(this.roundRobinGames);

  // Set this league as ongoing
  this.status = tournamentConstants.STATUS.ongoing;

}

League.prototype.finish = function(){
  this.status = tournamentConstants.STATUS.finished;
}

League.prototype.getPendingGames = function(){
  return this.roundRobinGames.filter(function(game){
    return game.status === gameConstants.STATUS.programmed;
  });
}

League.prototype.finished = function(){
  return this.getPendingGames().length === 0;
}

League.prototype.getNextGame = function(){

  // For each pending game
  var pendingGames = this.getPendingGames();

  // console.log(pendingGames.length);

  for(var i = 0; i < pendingGames.length; i++){

    // Current game
    cGame = pendingGames[i];

    // If both players in game are available
    if(cGame.player_1.available && cGame.player_2.available){

      // Return this game as the next game
      return cGame;

    }
  }

  return undefined;
}

module.exports = League;