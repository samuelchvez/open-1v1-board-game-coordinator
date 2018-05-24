function getUnsocketedPlayerObject(player) {
  return {
    id: player.id,
    user_name: player.user_name,
    ranking: player.ranking,
    wins: player.wins,
    loses: player.loses,
    draws: player.draws,
    available: player.available,
    ip: player.ip
  };
}

function getUnsocketedGameObject(game) {
  return {
    id: game.id,
    date_time: game.date_time,
    player_1: getUnsocketedPlayerObject(game.player_1),
    player_2: getUnsocketedPlayerObject(game.player_2),
    winner: game.winner ? getUnsocketedPlayerObject(game.winner) : undefined,
    status: game.status
  };
}

// Linealize player list without socket reference
function getUnsocketedPlayerList(players){
  var usPlayers = [];

  // For each player name
  for(name in players){

    var playerObject = players[name];

    // Build list
    usPlayers.push(getUnsocketedPlayerObject(playerObject));
  }

  // Return list
  return usPlayers;
}

// Linealize player list without socket reference
function getUnsocketedPlayerGameList(games, statusFilters){

  var uspGames = [],
      cGame;

  // For each game ID
  for(gameID in games){

    // Current game
    cGame = games[gameID];

    // If there are status filters
    if(statusFilters && statusFilters.length > 0){

      // And the game status is in the status filters
      if(statusFilters.indexOf(cGame.status) > -1){

        // Push the game
        uspGames.push(getUnsocketedGameObject(cGame));
      }
    }
    else{

      // If there are no filters, push the game
      uspGames.push(getUnsocketedGameObject(cGame));
    }
  }

  // Return list
  return uspGames;
}

module.exports = {
  getUnsocketedPlayerList: getUnsocketedPlayerList,
  getUnsocketedPlayerGameList: getUnsocketedPlayerGameList
};