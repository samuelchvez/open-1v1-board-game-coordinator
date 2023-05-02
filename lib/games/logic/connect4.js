var gameConstants = require('../constants'),
    gameRandom = require('../../utils/gameRandom'),

    // Available tiles
    EMPTY = 0,
    BLACK = gameConstants.PLAYER_1_TURN_ID;
    WHITE = gameConstants.PLAYER_2_TURN_ID;

function Connect4(M, N){
  this.N = M;
  this.M = N;
}

function clone(board){
  return JSON.parse(JSON.stringify(board));
}

function getOpponentTileColor(tileColor){
  return tileColor === BLACK ? WHITE : BLACK;
}

Connect4.prototype.validateBoard = function(boardArray){

  // TODO: why each tile in board array is string??
  return boardArray.length === Math.pow(this.N, 2);
}

Connect4.prototype.isOnBoard = function(position){
  return position >= 0 && position < Math.pow(this.N, 2);
}

Connect4.prototype.ix = function(x, y) {
  return x + y * this.N;
}

Connect4.prototype.getStartingBoard = function(){

  const arr = new Array(M);
  for(let i = 0; i < M; i++) {
    arr[i] = new Array(N).fill(0);
  }
  return arr
}

Connect4.prototype.getTilePositionsToFlip = function(board, playingColor, position){

  // Core validations

  // If it's a balid board
  if(!this.validateBoard(board) ||

    // If it's a valid position
    !this.isOnBoard(position) ||

    // If it's an empty position
    board[position] !== EMPTY){

    return [];
  }

  // Get oponent tile color
  var otc = getOpponentTileColor(playingColor);

  // Possible move directions
  var deltaDirections ={
    down: this.ix(0, 1), // Down
    right_down: this.ix(1, 1), // Right down
    right: this.ix(1, 0), // Right
    right_up: this.ix(1, -1), // Right up
    up: this.ix(0, -1), // Up
    left_up: this.ix(-1, -1), // Left up
    left: this.ix(-1, 0), // Left
    left_down: this.ix(-1, 1) // Left down
  };

  // Auxiliar movement directions
  var lefts = [
        deltaDirections.left,
        deltaDirections.left_down,
        deltaDirections.left_up
      ],
      rights = [
          deltaDirections.right,
          deltaDirections.right_down,
          deltaDirections.right_up
      ];

  // Calculate which tiles to flip
  var  tilePositionsToFlip = [];

  // For each movement direction
  for (movementKey in deltaDirections){

    // Movement delta
    var movementDelta = deltaDirections[movementKey],

    // Position tracker
        cPosition = position,

    // Tiles positions captured over this movement direction
        positionsToFlip = [],

    // Flag indicating if theere are tiles to capture in this movement direction
        shouldCaptureInThisDirection = false;

    // While position tracker is on board
    while(this.isOnBoard(cPosition)){

      // Avoid logic on first tile
      if(cPosition !== position){

        // If in this new position is an opponent tile
        if(board[cPosition] === otc){
          positionsToFlip.push(cPosition);
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

      // Check if next movement is going to wrap a row

      // Off board
      if((cPosition % this.N === 0 && lefts.indexOf(movementDelta) > -1) ||
        ((cPosition % this.N === this.N - 1) && rights.indexOf(movementDelta) > -1))
        break;

      // Move
      cPosition += movementDelta;
    }

    // If we should capture
    if(shouldCaptureInThisDirection){
      for(var i = 0; i < positionsToFlip.length; i++){
        tilePositionsToFlip.push(positionsToFlip[i]);
      }
    }
  }

  return tilePositionsToFlip;
};

Connect4.prototype.getAllValidMoves = function(board, tileColor){
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

Connect4.prototype.judge = function(board){
  var judgement = {};
  judgement[BLACK] = 0;
  judgement[WHITE] = 0;
  judgement[EMPTY] = 0;

  for(var i = 0; i < board.length; i++){
    judgement[board[i]]++;
  }

  return judgement;
}

//Check if the game is over
Connect4.prototype.check = function(board){
    
    // Vertical
    for (let x = 0; x < N; x++) {
        for (let y = 0; y < M - 3; y++) {
            if (
                board[y][x] === board[y + 1][x] &&
                board[y][x] === board[y + 2][x] &&
                board[y][x] === board[y + 3][x] &&
                board[y][x] !== 0
            ) {
                console.log("Vertical");
                return true;
            }
        }
    }

    // Horizontal
    for (let x = 0; x < N - 3; x++) {
        for (let y = 0; y < M; y++) {
            if (
                board[y][x] === board[y][x + 1] &&
                board[y][x] === board[y][x + 2] &&
                board[y][x] === board[y][x + 3] &&
                board[y][x] !== 0
            ) {
                console.log("Horizontal");
                return true;
            }
        }
    }

    // Diagonal Derecha
    for (let x = 0; x < N - 3; x++) {
        for (let y = 0; y < M - 3; y++) {
            if (
                board[y][x] === board[y + 1][x + 1] &&
                board[y][x] === board[y + 2][x + 2] &&
                board[y][x] === board[y + 3][x + 3] &&
                board[y][x] !== 0
            ) {
                console.log("Diagonal Derecha");
                return true;
            }
        }
    }

    // Diagonal Izquierda
    for (let x = 0; x < N - 3; x++) {
        for (let y = 3; y < M; y++) {
            if (
                board[y][x] === board[y - 1][x + 1] &&
                board[y][x] === board[y - 2][x + 2] &&
                board[y][x] === board[y - 3][x + 3] &&
                board[y][x] !== 0
            ) {
                console.log("Diagonal Izquierda");
                return true;
            }
        }
    }

    return false;
}

//Check if there is a tie
Connect4.prototype.check_tie = function(board){
    for (let x = 0; x < N; x++) {
        if (board[0][x] === 0) {
            return false;
        }
    }
    return true;
}

//Make the next move
Connect4.prototype.play = function(game, player, movement, nextMoveCb, finishGameCb, errorCb){

    // Validate current turn
    if(playingTurnID !== game.currentTurn){
      errorCb({
        status: 400,
        message: 'Incongruent turn'
      });
      return;
    }
    
    game.movementNumber++;

    if (game.player_1.id === player.id) {
        playingColor = BLACK;
        playingTurnID = gameConstants.PLAYER_1_TURN_ID;

        otherPlayer = game.player_2;
        otherPlayerColor = WHITE;
        otherTurnID = gameConstants.PLAYER_2_TURN_ID;
    } else {
        playingColor = WHITE;
        playingTurnID = gameConstants.PLAYER_2_TURN_ID;

        otherPlayer = game.player_1;
        otherPlayerColor = BLACK;
        otherTurnID = gameConstants.PLAYER_1_TURN_ID;
    }

    const rows = game.board - 1;

    if (movement >= this.N) {
        nextMoveCb(game, player);
        return;
    }

    for (let i = rows; i >= 0; i--) {
        if (game.board[i][movement] === 0) {
            game.board[i][movement] = player.color;
            break;
        } else {
            if (i === 0) {
                nextMoveCb(game, player);
                return;
            }
        }
    }

    if (this.check(game.board)) {
        game.winner = player;
        game.loser = otherPlayer;

        game.winner++;
        game.loser++;

        game.status = gameConstants.STATUS.finished;
        finishGameCb(game, game.winner);
        return;
    }
    
    if (check_tie(board)) {
        game.winner = undefined;
        game.loser = undefined;

        game.status = gameConstants.STATUS.finished;
        finishGameCb(game, game.winner);
        return;
    }

    game.currentTurn = otherTurnID
    nextMoveCb(game, otherPlayer);
}

module.exports = Connect4;