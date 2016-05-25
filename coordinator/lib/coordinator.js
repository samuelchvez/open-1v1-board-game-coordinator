var gameConstants = require('./games/constants'),
    gameRandom = require('./utils/gameRandom'),
    gameLists = require('./gameLists'),
    tournamentConstants = require('./tournament/constants'),

    // TODO: unmock tournament format
    League = require('./tournament/formats/League.js'),

    Game = require('./games/Game.js'),
    Player = require('./games/Player.js'),

    // TODO: unmock game logic loading
    Othello = require('./games/logic/othello');

// Static tournament definition
// TODO: from DB
// TODO: check the best place to configure tournaments
var tournaments = {
      '142857': new League(
        '142857',
        4,
        new Othello(8))
    },
    ROUND_ROBIN_DAEMON_PATIENCE = 50;


function getRoom(tournament){
  return 'tournament:' + tournament.id;
}

function signIn(socket, data){
  var username = data.user_name,
      password = data.user_password || '', // TODO: Unmock password
      role = data.user_role || gameConstants.INGAME_USER_ROLES.player,
      tournamentID = data.tournament_id,
      tournament,
      room,
      player;

  // TODO: from DB
  if(tournamentID in tournaments){

    // Fetch tournament

    // TODO: from DB
    tournament = tournaments[tournamentID];

    // Generate tournament room
    room = getRoom(tournament);

    // Fetch player
    // TODO: Unmock the ranking and id definition
    player = new Player(gameRandom.getID(), data.user_name, socket);

    // TODO: check login

    // TODO: check user type (admin / player / etc)
    if(role === gameConstants.INGAME_USER_ROLES.player){
      tournament.registerPlayer(
        player,

        // Success
        function(response){

          // Log arrival
          console.log("New player registered to the tournament: " + player.user_name);

          // Join socket to the tournament room
          socket.join(room);

          // Emit success signin signal
          socket.emit('ok_signin');

          // Notify new player joining to the tournament channel
          socket.broadcast.to(room).emit(
            'player_list_changed',
            gameLists.getUnsocketedPlayerList(tournament.playerTable));

          // Emit user list changed signal
          socket.broadcast.to(room).emit(
            'game_list_changed',
            gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));
        },

        // Failure
        function(response){

          // Log rejection
          console.log("New player rejected from the tournament " + tournamentID);

          // Emit error signal
          socket.emit('error_signin', response);
        }
      );
    }
    else{

      // Join socket to the tournament room
      socket.join(room);

      // Emit success signin signal
      socket.emit('ok_signin');

      // Notify new player joining to the tournament channel
      socket.emit(
        'player_list_changed',
        gameLists.getUnsocketedPlayerList(tournament.playerTable));

      // Emit user list changed signal
      socket.emit(
        'game_list_changed',
        gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));
    }
  }
  else{

    // Notify error
    socket.emit('error_signin', {
      status: 404,
      message: 'Tournament ' + tournamentID + ' does not exist'
    });
  }
}

// Round robin check procedure
// NOTICE: it's not needed to save on DB here, it should be done at 'play' when
// game is done.
function nextGameDaemonProcedure(socket, tournament){

  // Try to get the next game
  var nextGame = tournament.getNextGame(),
      roomName = getRoom(tournament.id);

  // If the tournament is not finished and there is a next game
  if(!tournament.finished()){

    if(nextGame){

      // Start the game
      nextGame.start();

      // Register new game
      tournament.ongoingGames[nextGame.id] = nextGame;

      // Notify player 1
      nextGame.player_1.socket.emit('ready', {
        game_id: nextGame.id,
        player_id: gameConstants.PLAYER_1_TURN_ID,
        board: nextGame.board,
        movementNumber: nextGame.movementNumber
      });

      // Log that match started
      console.log(
        "New match started: " + 
          nextGame.id + " (" + nextGame.player_1.user_name + " vs " +
          nextGame.player_2.user_name + ")"
      );

      // Emit 

      // Emit that users list changed
      socket.emit(
        'player_list_changed',
        gameLists.getUnsocketedPlayerList(tournament.playerTable));

      // Emit that game list changed
      socket.emit(
        'game_list_changed',
        gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));

    }
  }
  else{

    console.log("");
    console.log("ATTENTION!! Tournament " + tournament.id + " has finished");
    console.log("");

    // Tournament is done
    tournament.finish();

    // Clear interval
    clearInterval(tournament.daemonIntervalID);
  }
}

function startTournament(socket, tournamentID){

  // TODO: from DB
  if(tournamentID in tournaments){

    var tournament = tournaments[tournamentID];

    if(tournament.status === tournamentConstants.STATUS.waiting){

      // Start
      tournament.start(function(games){

        // TODO: emit
        socket.broadcast.to(
          getRoom(tournament)).emit('tournament_started');

        console.log("");
        console.log("ATTENTION!! Tournament " + tournament.id + " has started");
        console.log("");

        // Start daemon
        tournament.daemonIntervalID = setInterval(
          function(){
            nextGameDaemonProcedure(socket, tournament)
          },
          ROUND_ROBIN_DAEMON_PATIENCE);
      });
    }
  }
}

function playerReady(socket, data){
  var tournamentID = data.tournament_id,
      turnID = data.turn_id,
      gameID = data.game_id,
      player;

  // If the tournament is live
  if(tournamentID in tournaments){

    // Retrieve player
    var tournament = tournaments[tournamentID];

    // Retrieve game
    var game = tournament.ongoingGames[gameID];

    // Select player
    player = turnID === gameConstants.PLAYER_1_TURN_ID ? game.player_1 : game.player_2;

    // Set as available
    player.available = true;

    socket.broadcast.to(getRoom(tournament)).emit(
      'player_list_changed',
      gameLists.getUnsocketedPlayerList(tournament.playerTable)
    );
  }
}

function play(socket, data){
  var tournamentID = data.tournament_id,
      gameID = data.game_id,
      playerTurnID = data.turn_id,
      movement = data.movement;

  // If the tournament is live
  if(tournamentID in tournaments){

    var tournament = tournaments[tournamentID],
        roomName = getRoom(tournament);

    // If the game is in the tournament
    if(gameID in tournament.ongoingGames){

      var game = tournament.ongoingGames[gameID],
          player = playerTurnID === gameConstants.PLAYER_1_TURN_ID ? game.player_1 : game.player_2
          player_1 = game.player_1,
          player_2 = game.player_2
          movementPlayed = data.movement;

      // Game logic
      var result = game.play(
        player,
        movementPlayed,
        function(nextPlayer){

          // Send signal to player
          nextPlayer.socket.emit('ready', {
            turn_id: game.currentTurn,
            game_id: game.id,
            board: game.board,
            movementNumber: game.movementNumber
          });
        },
        function(winnerTurnID){

          // Notify game finished to the players
          player_1.socket.emit('finish', {
            game_id: game.id,
            winner_turn_id: winnerTurnID,
            turn_id: gameConstants.PLAYER_1_TURN_ID
          });

          player_2.socket.emit('finish', {
            game_id: game.id,
            winner_turn_id: winnerTurnID,
            turn_id: gameConstants.PLAYER_2_TURN_ID
          });

          // Emit that player list changed
          socket.broadcast.to(roomName).emit(
              'player_list_changed',
              gameLists.getUnsocketedPlayerList(tournament.playerTable));

          // Emit that game list changed
          socket.broadcast.to(roomName).emit(
              'game_list_changed',
              gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));
        },
        function(error){}
      );
    }
  }
}

function attatchEvents(socket){

  // Listen to the signin event ------------------------------------------------
  socket.on('signin', function(data){
    signIn(socket, data);
  });

  // Listen to the start league signal -----------------------------------------
  socket.on('start_tournament', function(tournamentID){
    startTournament(socket, tournamentID);
  });

  // Listen to the disconnect event --------------------------------------------
  socket.on('disconnect', function () {

    // TODO: handle properly the disconection of a user
    // NOTE: ***THIS WON'T BE A TRIVIAL LOGIC***

  });

  // Listen to the play signal -------------------------------------------------
  socket.on('play', function(data){
    play(socket, data);
  });

  // Listen to the rematch signal ----------------------------------------------
  socket.on('player_ready', function(data){
    playerReady(socket, data);
  });
}

module.exports = {
  attatchEvents: attatchEvents
}