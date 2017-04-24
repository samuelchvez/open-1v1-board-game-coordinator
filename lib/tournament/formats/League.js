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

function findPlayer(playerTable, userName){

  // If the table is defined
  if(playerTable){

    // For each player in the player table
    for(playerID in playerTable){

      // If the username is already registered
      if(playerTable[playerID].user_name == userName){
        return playerTable[playerID];
      }
    }
  }

  return undefined;
}

League.prototype.registerPlayer = function(player, successCb, failureCb){

  // If the player is not already registered for this league
  var playerFound = findPlayer(this.playerTable, player.user_name);
  if(!playerFound){

    // If the league is ready to register players
    if(this.status === tournamentConstants.STATUS.waiting){

      // Register brand new player
      this.playerTable[player.id] = player;

      // TODO: save in DB

      // Notify successful register
      successCb({
        status: 200,
        message: 'Player successfully registered in league ' + this.id
      });
    }
    else{
      failureCb({
        status: 400,
        message: 'League is not waiting connections'
      });
    }
  }
  else{

    // Reconnect: update socket reference
    this.playerTable[playerFound.id].socket = player.socket;

    successCb({
      status: 202,
      message: 'Player already registered in league ' + this.id
    });
  }
}

League.prototype.unregisterPlayer = function(player, successCb, failureCb){

  // If the league is ready to register players
  if(this.status === tournamentConstants.STATUS.waiting){

    // If the player is not already registered for this league
    var playerFound = findPlayer(this.playerTable, player.user_name);
    if(!playerFound){

      // Notify failure
      failureCb({
        status: 404,
        message: 'Player wasnt registered in league ' + this.id
      });
    }
    else{

      // Unregister
      delete this.playerTable[playerFound.id];

      successCb({
        status: 200,
        message: 'Player successfully unregistered from league ' + this.id
      });
    }
  }
  else{
    failureCb({
      status: 400,
      message: 'League is not waiting connections, therefore you cannot unregister a player'
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

        if(k % 2 === 0){
          newGame = new Game(
            this.gameLogic,
            this.playerTable[playerIDs[i]],
            this.playerTable[playerIDs[j]]);
        }
        else{
          newGame = new Game(
            this.gameLogic,
            this.playerTable[playerIDs[j]],
            this.playerTable[playerIDs[i]]);
        }

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

League.prototype.reset = function(cb){

  // Clear roundRobin
  this.roundRobinGames = [];

  // Clear ongoing games
  this.ongoingGames = {};

  // Free players
  for(playerID in this.playerTable){
    this.playerTable[playerID].available = true;
    this.playerTable[playerID].wins = 0;
    this.playerTable[playerID].loses = 0;
  }

  // Change status
  this.status = tournamentConstants.STATUS.waiting;

  // Callback
  cb();

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