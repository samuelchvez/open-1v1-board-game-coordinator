var gameConstants = require('../constants'),
    gameRandom = require('../../utils/gameRandom'),

    // Available tiles
    EMPTY = 0,
    BLACK = gameConstants.PLAYER_1_TURN_ID,
    WHITE = gameConstants.PLAYER_2_TURN_ID,

    VALID_TILES = [EMPTY, WHITE, BLACK];

function Othello(N){
  this.N = N - N % 2; // Ensure even size
}

function clone(board){
  return JSON.parse(JSON.stringify(board));
}

function getOpponentTileColor(tileColor){
  return tileColor === BLACK ? WHITE : BLACK;
}

Othello.prototype.validateBoard = function(boardArray){
  if(boardArray.length === Math.pow(this.size, 2)){
    for(tile in boardArray){
      if(!(tile in VALID_TILES))
        return false;
    }

    return true;
  }

  return false;
}

Othello.prototype.isOnBoard = function(position){
  return position >= 0 && position < Math.pow(this.size, 2);
}


Othello.prototype.ix = function(x, y) {
  return x + y * this.N;
}

Othello.prototype.getStartingBoard = function(blackStarts){

  var board = [];

  for (var x = 0; x < this.N; x++)
    for (var y = 0; y < this.N; y++)
      board[ix(x, y)] = EMPTY;

  var x2 = this.N >> 1;
  var y2 = this.N >> 1;

  if(blackStarts){
    board[ix(x2 - 1, y2 - 1)] = WHITE;
    board[ix(x2 - 1, y2 - 0)] = BLACK;
    board[ix(x2 - 0, y2 - 1)] = BLACK;
    board[ix(x2 - 0, y2 - 0)] = WHITE;
  }
  else{
    board[ix(x2 - 1, y2 - 1)] = BLACK;
    board[ix(x2 - 1, y2 - 0)] = WHITE;
    board[ix(x2 - 0, y2 - 1)] = WHITE;
    board[ix(x2 - 0, y2 - 0)] = BLACK;
  }

  return board;
}

Othello.prototype.getTilePositionsToFlip = function(board, playingColor, position){

  // Core validations

  // If it's a balid board
  if(!this.validateBoard(board) ||

    // If it's a valid position
    !this.isOnBoard(position) ||

    // If it's an empty position
    board[position] !== EMPTY_TILE_ID){

    return [];
  }

  // Get oponent tile color
  var otc = getOpponentTileColor(playingColor);

  // Possible move directions
  var deltaDirections =[
    this.ix(0, 1), // Down
    this.ix(1, 1), // Right down
    this.ix(1, 0), // Right
    this.ix(1, -1), // Right up
    this.ix(0, -1), // Up
    this.ix(-1, -1), // Left up
    this.ix(-1, 0), // Left
    this.ix(-1, 1)] // Left down
  ];

  // Calculate which tiles to flip
  var  tilePositionsToTurn = [];

  // For each movement direction
  for (var i = 0; i < deltaDirections.length; i++){

    // Movement delta
    var movementDelta = deltaDirections[i],

    // Position tracker
        cPosition = position,

    // Tiles positions captured over this movement direction
        positionsToTurn = [],

    // Flag indicating if theere are tiles to capture in this movement direction
        shouldCaptureInThisDirection = false;

    // While position tracker is on board
    while(this.isOnBoard(cPosition)){

      // Avoid logic on first tile
      if(cPosition !== position){

        // If in this new position is an opponent tile
        if(board[cPosition] === otc){
          positionsToTurn.push(cPosition);
        }
        else{

          // If the current position contains an empty tile, means that we didn't
          // reach a tile of the same color, therefore shouldn't flip any coin in
          // this direction. Else, if the current position holds a tile with the
          // same color of the playing turn, we should mark our findings to turn
          shouldCaptureInThisDirection = board[cPosition] !== EMPTY;
          break;
        }
      }

      // Move
      cPosition += movementDelta;
    }

    // If we should capture
    if(shouldCaptureInThisDirection){
      for(positionToTurn in positionsToTurn){
        tilePositionsToTurn.push(positionToTurn);
      }
    }
  }

  return tilePositionsToTurn;
};

Othello.prototype.getAllValidMoves = function(board, tileColor){
  var validMoves = [];
  for(var x = 0; x < this.N; x++){

    for(var y = 0; y < this.N; y++){

      if(this.getTilePositionsToFlip(board, tileColor, this.ix(x, y)).length > 0){
        validMoves.push(this.ix(x, y));
      }
    }
  }

  return validMoves;
};

Othello.prototype.judge = function(board){
  var judgement = {};
  judgement[BLACK] = 0;
  judgement[WHITE] = 0;
  judgement[EMPTY] = 0;

  for(tile in board){judgement[tile]++;}
}

Othello.prototype.play = function(game, player, movement, nextMoveCb, finishGameCb, errorCb){

  // Deduct playing color
  var playingColor,
      otherPlayer,
      otherPlayerColor,
      playingTurnID,
      otherTurnID;

  // Generic turn references
  if(game.player_1.id === player.id){
    playingColor = BLACK;
    playingTurnID = gameConstants.PLAYER_1_TURN_ID;

    otherPlayer = game.plalyer_2;
    otherPlayerColor = WHITE;
    otherTurnID = gameConstants.PLAYER_2_TURN_ID;
  }
  else{
    playingColor = WHITE;
    playingTurnID = gameConstants.PLAYER_2_TURN_ID;

    otherPlayer = game.player_1;
    otherPlayerColor = BLACK;
    otherTurnID = gameConstants.PLAYER_1_TURN_ID;
  }

  // Validate current turn
  if(playingTurnID === game.currentTurn){

    // Deduct tiles that will be flipped
    var tilePositionsToFlip = this.getTilePositionsToFlip(game.board, playingColor, movement);

    if(tilePositionsToFlip.length > 0){

      // Flip and place all the captured tiles
      for(tilePosition in tilePositionsToFlip){
        game.board[tilePosition] = playingColor;
      }

      // And then flip the current position
      game.board[movement] = playingColor;

      // Augment movement number
      game.movementNumber++;
    }

    // Invalid movement
    else{

      // Repeat turn

      // Swap player references, just to hack the next validations...

      var tmpOtherPlayerColor = otherPlayerColor,
          tmpOtherPlayer = otherPlayer,
          tmpOtherTurnID = otherTurnID;

      // When error occurs, we consider next player as the current player
      otherPlayerColor = playingColor;
      otherPlayer = player;
      otherTurnID = playingTurnID;

      // And the current player as the next player
      playingColor = tmpOtherPlayerColor;
      player = tmpOtherPlayer;
      playingTurnID = tmpOtherTurnID;
    }

    // Check if there is any valid movement left
    var nextValidMoves = this.getAllValidMoves(game.board, otherPlayerColor);

    // If there are valid movements for the defacto next player
    if(nextValidMoves.length > 0){

      // Update current turn
      game.currentTurn = otherTurnID;

      // He should play next
      nextMoveCb(game, otherPlayer);
    }
    else{

      // Check if there is any valid movement left
      nextValidMoves = this.getAllValidMoves(game.board, playingColor);

      if(nextValidMoves.length > 0){

        // Update current turn
        game.currentTurn = playingTurnID;

        // Try to play again with the same player
        nextMoveCb(game, player);
      }

      // If there are no valid moves for any player
      else{

        // Get winner
        var judgement = this.judge(game.board);

        // If it's draw
        if(judgement[BLACK] === judgement[WHITE]){
          game.winner = undefined;
          game.loser = undefined;
        }
        else{

          // If black wins, it means player 1 wins
          if(judgement[BLACK] > judgement[WHITE]){
            game.winner = game.player_1;
            game.loser = game.player_2;
          }

          // If white wins, it means player 2 wins
          else{
            game.winner = game.player_1;
            game.loser = game.player_2;
          }

          // Update wins and loses
          game.winner.wins++;
          game.loser.loses++;
        }

        // Set game as finished
        game.status = gameConstants.STATUS.finished;

        // Finish game callback
        finishGameC(game, game.winner);
      }
    }
  }
  else{
    errorCb({
      status: 400,
      message: 'Incongruent turn'
    });
  }
}

module.exports = Othello;