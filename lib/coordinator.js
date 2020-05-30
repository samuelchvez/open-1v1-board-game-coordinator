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
    DotsAndBoxes = require('./games/logic/dotsAndBoxes');

// Static tournament definition
// TODO: from DB
var tournaments = {},
    onlinePlayers = {},
    ROUND_ROBIN_DAEMON_PATIENCE = 100;

var argv = require('minimist')(process.argv.slice(2));
var tournamentID = argv.tid;
var roundRobinTimes = argv.rrt;
var gameType = argv.game;
var game;

if(gameType === 'othello'){
  game = new Othello(8);
} else if(gameType === 'dotsAndBoxes') {
  game = new DotsAndBoxes(6);
}

tournaments[tournamentID] = new League(
  tournamentID,
  roundRobinTimes,
  game);

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

          // Register player / tournament relation, used in disconnect event
          (function(s, r, t, p){

            s.on('disconnect', function(){

              // Socket leaving room
              s.leave(r);

              // Unregister player from tournament
              t.unregisterPlayer(
                p,
                function(data){
                  s.broadcast.to(r).emit(
                    'player_list_changed',
                    gameLists.getUnsocketedPlayerList(t.playerTable));
                },

                // TODO: handle errors
                function(data){});
            });

          })(socket, room, tournament, player);

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

      // Emit current tournament status
      socket.emit('tournament_status_changed', {status: tournament.status});
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
      roomName = getRoom(tournament);

  // If the tournament is not finished and there is a next game
  if(!tournament.finished()){

    if(nextGame){

      // Start the game
      nextGame.start();

      // Register new game
      tournament.ongoingGames[nextGame.id] = nextGame;

      nextGame.player_1.socket.emit('ready', {
        game_id: nextGame.id,
        player_turn_id: gameConstants.PLAYER_1_TURN_ID,
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

    // Tournament finished signal
    socket.broadcast.to(roomName).emit(
      'tournament_status_changed', {
        status: tournamentConstants.STATUS.finished
      }
    );

    socket.emit(
      'tournament_status_changed', {
        status: tournamentConstants.STATUS.finished
      }
    );
  }
}

function startTournament(socket, tournamentID){

  // TODO: from DB
  if(tournamentID in tournaments){

    var tournament = tournaments[tournamentID];

    if(tournament.status === tournamentConstants.STATUS.waiting){

      // Start
      tournament.start(function(games){

        // Emit signal indicating that tournament status changed
        socket.broadcast.to(
          getRoom(tournament)).emit('tournament_status_changed', { status: tournamentConstants.STATUS.ongoing });
        socket.emit('tournament_status_changed', { status: tournamentConstants.STATUS.ongoing });

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
      turnID = data.player_turn_id,
      gameID = data.game_id,
      player;

  // If the tournament is live
  if(tournamentID in tournaments){

    // Retrieve player
    var tournament = tournaments[tournamentID];

    if(gameID in tournament.ongoingGames){

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
}

function play(socket, data){
  var tournamentID = data.tournament_id,
      gameID = data.game_id,
      playerTurnID = data.player_turn_id,
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
      game.play(
        player,
        movementPlayed,
        function(cGame, nextPlayer){

          // Send signal to player
          nextPlayer.socket.emit('ready', {
            player_turn_id: cGame.currentTurn,
            game_id: cGame.id,
            board: cGame.board,
            movementNumber: cGame.movementNumber
          });
        },
        function(cGame, winnerPlayer){

          var winnerTurnID;

          if(winnerPlayer)
            winnerTurnID = cGame.player_1.id === winnerPlayer.id ? gameConstants.PLAYER_1_TURN_ID : gameConstants.PLAYER_2_TURN_ID;

          // Notify game finished to the players
          cGame.player_1.socket.emit('finish', {
            game_id: cGame.id,
            winner_turn_id: winnerTurnID,
            player_turn_id: gameConstants.PLAYER_1_TURN_ID,
            board: cGame.board
          });

          cGame.player_2.socket.emit('finish', {
            game_id: cGame.id,
            winner_turn_id: winnerTurnID,
            player_turn_id: gameConstants.PLAYER_2_TURN_ID,
            board: cGame.board
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

function unstuckGame(socket, data){
  var tournamentID = data.tournament_id,
      gameID = data.game_id,
      winnerTurnID = data.winner_turn_id;

  // If the tournament is created
  if(tournamentID in tournaments){

    var tournament = tournaments[tournamentID];

    // If the game is from the tournament
    if(gameID in tournament.ongoingGames){

      // Get the game
      var game = tournament.ongoingGames[gameID];

      // Check which player won and set game's winner and loser
      if(winnerTurnID === gameConstants.PLAYER_1_TURN_ID){
        game.winner = game.player_1;
        game.loser = game.player_2;
      }
      else{
        game.winner = game.player_2;
        game.loser = game.player_1;
      }

      // Update wins and loses
      game.winner.wins++;
      game.loser.loses++;

      // Set game as finished
      game.status = gameConstants.STATUS.finished;

      // Notify game finished to the players
      game.player_1.socket.emit('finish', {
        game_id: game.id,
        winner_turn_id: winnerTurnID,
        player_turn_id: gameConstants.PLAYER_1_TURN_ID,
        board: game.board
      });

      game.player_2.socket.emit('finish', {
        game_id: game.id,
        winner_turn_id: winnerTurnID,
        player_turn_id: gameConstants.PLAYER_2_TURN_ID,
        board: game.board
      });

      // Emit that player list changed
      socket.emit(
          'player_list_changed',
          gameLists.getUnsocketedPlayerList(tournament.playerTable));

      // Emit that game list changed
      socket.emit(
          'game_list_changed',
          gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));

    }
  }
}

function resetTournament(socket, tournamentID){

  // TODO: from DB
  if(tournamentID in tournaments){

    var tournament = tournaments[tournamentID];

    if(tournament.status !== tournamentConstants.STATUS.waiting){

      // Start
      tournament.reset(function(){

        // Emit signal indicating that tournament status changed
        socket.broadcast.to(
          getRoom(tournament)).emit('tournament_status_changed', { status: tournamentConstants.STATUS.waiting });
        socket.emit('tournament_status_changed', { status: tournamentConstants.STATUS.waiting });

        // Emit that player list changed
        socket.emit(
            'player_list_changed',
            gameLists.getUnsocketedPlayerList(tournament.playerTable));

        // Emit that game list changed
        socket.emit(
            'game_list_changed',
            gameLists.getUnsocketedPlayerGameList(tournament.ongoingGames));

        console.log("");
        console.log("ATTENTION!! Tournament " + tournament.id + " has been reset");
        console.log("");

        // Clear interval
        clearInterval(tournament.daemonIntervalID);
      });
    }
  }
}

function attatchEvents(socket){

  // Listen to the signin event
  socket.on('signin', function(data){
    signIn(socket, data);
  });

  // Listen to the start tournament signal
  socket.on('start_tournament', function(tournamentID){
    startTournament(socket, tournamentID);
  });

  // Listen to the reset tournament signal
  socket.on('reset_tournament', function(tournamentID){
    resetTournament(socket, tournamentID);
  });

  // Listen to the unstuck game event
  socket.on('unstuck_game', function(data){
    unstuckGame(socket, data);
  });

  // Listen to the play signal
  socket.on('play', function(data){
    play(socket, data);
  });

  // Listen to the rematch signal
  socket.on('player_ready', function(data){
    playerReady(socket, data);
  });
}

module.exports = {
  attatchEvents: attatchEvents
}
