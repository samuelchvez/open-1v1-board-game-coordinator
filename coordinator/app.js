#!/usr/bin/env node
var express = require('express');
var app = express();

// Server port
app.set('port', process.env.PORT || 3000);

// Socket io
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Create server
http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Random integer generator
function randint(a, b){
  return parseInt(Math.floor(a + Math.random()*(b - a)));
}

function generateStartingBoard(player_1Turn){
  if(player_1Turn){
    return [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, PLAYER_2_ID, PLAYER_1_ID, 0, 0, 0,
      0, 0, 0, PLAYER_1_ID, PLAYER_2_ID, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ];
  }

  return [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, PLAYER_1_ID, PLAYER_2_ID, 0, 0, 0,
    0, 0, 0, PLAYER_2_ID, PLAYER_1_ID, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ];
}

function generateValidID(keyObject){
  var newID;

  do{
    newID = randint(0, INF);
  }
  while(newID in keyObject);

  return newID;
}

function generateNewGame(player_1, player_2, player_1Turn){

  // Build new game
  return {
    id: generateValidID(games),
    player_1: player_1,
    player_2: player_2,
    board: generateStartingBoard(player_1Turn),
    currentTurn: player_1Turn ? PLAYER_1_ID : PLAYER_2_ID,
    movementNumber: 0,

    // Hidden
    status: GAME_STATUS.programmed,
    is_rematch: false,
    rematchReady_1: false,
    rematchReady_2: false,
    date_time: new Date(),
    series: 0,
    winner: false
  };
}

// Linealize player list without socket reference
function buildOnlinePlayerList(socketedPlayerList){
  var onlinePlayerList = [];

  // For each player name
  for(name in socketedPlayerList){

    var playerObject = socketedPlayerList[name];

    // Build list
    onlinePlayerList.push({
      name: name,
      ranking: playerObject.ranking,
      wins: playerObject.wins,
      loses: playerObject.loses,
      draws: playerObject.draws,
      available: playerObject.available
    });
  }

  // Return list
  return onlinePlayerList;
}

// Linealize player list without socket reference
function buildStartedGameList(socketedPlayerGameList){

  var gameList = [];

  for(gameId in socketedPlayerGameList){
    var gameObject = games[gameId];

    if(gameObject.status === GAME_STATUS.ongoing ||
        gameObject.status == GAME_STATUS.finished){

      gameList.push({
        game_id: gameId,
        date_time: gameObject.date_time,
        player_1: {name: gameObject.player_1.name},
        player_2: {name: gameObject.player_2.name},
        winner: gameObject.winner ? gameObject.winner.name : false,
        status: gameObject.status
      });
    }
  }

  // Return list
  return gameList;
}

// Generate round robin game table
function generateRoundRobin(playersTable) {
  // Clear roundRobin
  var roundRobinTable = [];

  // Generate round robin matches
  var playerNames = Object.keys(playersTable),
      newGame;

  // From the first player to the last
  for(var i = 0; i < playerNames.length; i++){

    // From the next player and go on
    for(var j = i + 1; j < playerNames.length; j++){

      // Create new game
      newGame = generateNewGame(
        playersTable[playerNames[i]],
        playersTable[playerNames[j]],
        true
      );

      // Add new game to the round robin table
      roundRobinTable.push(newGame);
    }
  }

  return roundRobinTable;
}

// Round robin check procedure
function roundRobinDaemonProcedure(roundRobinTable){

  var cGame;

  // For each game programmed
  for(var i = 0; i < roundRobinTable.length; i++){

    // Current game
    cGame = roundRobinTable[i];

    if(cGame && cGame.player_1.available && cGame.player_2.available){

      // Mark game as ongoing
      cGame.status = GAME_STATUS.ongoing;

      // Set both players as unavailable
      cGame.player_1.available = false;
      cGame.player_2.available = false;

      // Register new game
      games[cGame.id] = cGame;

      // Notify player 1
      cGame.player_1.socket.emit('ready', {
        game_id: cGame.id,
        player_id: PLAYER_1_ID,
        board: cGame.board,
        movementNumber: cGame.movementNumber
      });

      // Remove game from round robin table
      roundRobinTable[i] = undefined;

      console.log(
        "New match started! First Game: " + cGame.id + " (" + cGame.player_1.name + " vs " + cGame.player_2.name + ")"
      );

      // Emit that users list changed
      io.sockets.emit('playerListChanged', buildOnlinePlayerList(players));

      // Emit that game list changed
      io.sockets.emit('gameListChanged', buildStartedGameList(games));
    }
  }
}

// Constants
var PLAYER_1_ID                                             = 1,
    PLAYER_2_ID                                             = 2,
    SET_SIZE                                                = 4,
    INF                                                     = 4294967200,
    GAME_STATUS                                             = {
                                                              finished: 'finished',
                                                              programmed: 'programmed',
                                                              ongoing: 'ongoing'
                                                            },
    LEAGUE_STATUSES                                         = {
                                                              started: 'started',
                                                              waiting: 'waiting'
                                                            },
    LEAGUE_STATUS                                           = LEAGUE_STATUSES.waiting,
    ROUND_ROBIN_DAEMON_PATIENCE                             = 500;

// Players and games accumulators
var players                                                 = {},
    games                                                   = {},
    gameRoundRobin                                          = [],
    roundRobinDaemon;

// Each time a new socket connection is open
io.on('connection', function(socket){

  // Report connection
  console.log('New connection open');

  // Report successful connection
  socket.emit('connectionSucceed', {
    players: buildOnlinePlayerList(players),
    games: buildStartedGameList(games)
  });

  // Listen to the disconnect event --------------------------------------------
  socket.on('disconnect', function () {
    var playerNameToDelete;
    for(playerName in players){
      if(socket === players[playerName].socket){
        playerNameToDelete = playerName;
        break;
      }
    }

    delete players[playerNameToDelete];

    // Emit user list changed signal
    io.sockets.emit('playerListChanged', buildOnlinePlayerList(players));
  });

  // Listen to the signin event ------------------------------------------------
  socket.on('signin', function(player){

    if(LEAGUE_STATUS === LEAGUE_STATUSES.waiting){

      // Log arrival
      console.log("New player arrival: " + player.name);

      // If player already signed in
      if(player.name in players){

        // Log rejection
        console.log("New player rejected from the league (name error): " + player.name);

        // Emit error signal
        socket.emit(
          'error_signin', {
            status: 409,
            error: 'User already signed in. Chose another username.'
          }
        );
      }
      else{

        // Log arrival
        console.log("New player registered to the league: " + player.name);

        // Emit success signin signal
        socket.emit('ok_signin');

        // Register player in players
        players[player.name] = {
          name: player.name,
          socket: socket,
          available: true,
          ranking: 0,
          wins: 0,
          loses: 0,
          draws: 0
        };

        // Emit user list changed signal
        io.sockets.emit('playerListChanged', buildOnlinePlayerList(players));

        // Emit that game list changed
        io.sockets.emit('gameListChanged', buildStartedGameList(games));
      }
    }
    else{
      // Log rejection
      console.log("New player rejected from the league (league has started): " + player.name);

      // Emit error signal
      socket.emit(
        'error_signin', {
          status: 409,
          error: 'League has already started.'
        }
      );
    }
  });

  // Listen to the rematch signal ----------------------------------------------
  socket.on('rematch_ready', function(data){
    var game = games[data.game_id];

    // Flag as ready to rematch
    if(data.player_id == PLAYER_1_ID){
      game.rematchReady_1 = true;
    }
    else{
      game.rematchReady_2 = true;
    }

    // If both are ready
    if(game.rematchReady_1 && game.rematchReady_2){

      // Player fetch
      var player_1 = game.player_1,
          player_2 = game.player_2,
          player_1_starts = game.series % 2 == 1,

      // Rematch generation
          rematch = generateNewGame(player_1, player_2, player_1_starts);

      // Register rematch
      game.rematch_id = rematch.game_id;

      // Augment series
      rematch.series = game.series + 1;

      // Register previous game
      rematch.previous_id = game.id;

      // Register new game
      games[rematch.id] = rematch;

      // If player 1 starts
      if(player_1_starts){

        // Notify player 1
        player_1.socket.emit('ready', {
          game_id: rematch.id,
          player_id: PLAYER_1_ID,
          board: rematch.board,
          movementNumber: rematch.movementNumber
        });
      }
      else{

        // Notify player 2
        player_2.socket.emit('ready', {
          game_id: rematch.id,
          player_id: PLAYER_2_ID,
          board: rematch.board,
          movementNumber: rematch.movementNumber
        });
      }

      // Show on log
      console.log("Rematch started (" + rematch.id + "): " + player_1.name + " vs " + player_2.name);

      // This time user list did not change ;)
    }
  });

  // Listen to the play game signal --------------------------------------------
  socket.on('play', function(data){

    // Game logic
    var game = games[data.game_id],
        playerId = data.player_id,
        positionPlayed = data.position,
        player_1 = game.player_1,
        player_2 = game.player_2;

    // Apply logic and modify game.board

    // GAME LOGIC BITCH!
    game.movementNumber++;

    // Unmock winner calculation
    if(game.movementNumber > 4){

      // Aux message
      var winnerID = PLAYER_1_ID,
          willRematch = game.series < SET_SIZE - 1,
          finnishMessage = {
            game_id: game.id,
            winner_id: winnerID,
            rematch: willRematch
          };

      // Set game as finished
      game.status = GAME_STATUS.finished;

      // TODO: handle draw

      // Notify winner
      game.winner = winnerID == PLAYER_1_ID ? player_1 : player_2;
      game.loser = winnerID == PLAYER_1_ID ? player_2 : player_1;
      game.winner.wins++;
      game.loser.loses++;

      // Notify game finished to the players
      player_1.socket.emit('finish', finnishMessage);
      player_2.socket.emit('finish', finnishMessage);

      // Emit that game list changed
      io.sockets.emit('gameListChanged', buildStartedGameList(games));

      if(!willRematch){

        // Set available
        player_1.available = true;
        player_2.available = true;

        // Emit change player lsit signal
        io.sockets.emit('playerListChanged', buildOnlinePlayerList(players));
      }

      // Emit that game list changed
      io.sockets.emit('gameListChanged', buildStartedGameList(games));
    }
    else{

      // Unmock turn calculation

      // If player 1
      if(playerId == PLAYER_1_ID){

        // Ask player 2 to play
        player_2.socket.emit('ready', {
          game_id: game.id,
          player_id: PLAYER_2_ID,
          board: game.board,
          movementNumber: game.movementNumber
        });
      }
      else{

        // Ask player 1 to play
        player_1.socket.emit('ready', {
          game_id: game.id,
          player_id: PLAYER_1_ID,
          board: game.board,
          movementNumber: game.movementNumber
        });
      }
    }
  });

  // Listen to the start league signal -----------------------------------------
  socket.on('startLeague', function(){

    // Freeze signin
    LEAGUE_STATUS = LEAGUE_STATUSES.started;

    // Generate round robin games
    gameRoundRobin = generateRoundRobin(players);

    // Wake round robin daemon
    roundRobinDaemon = setInterval(
      function(){
        roundRobinDaemonProcedure(gameRoundRobin)
      },
      ROUND_ROBIN_DAEMON_PATIENCE);

  });
});