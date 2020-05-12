var gameConstants = require('../constants'),
    gameRandom = require('../../utils/gameRandom'),

    // Available tiles
    EMPTY = 99,
    FILLED = 0,
    FILLEDP11 = 1,
    FILLEDP12 = 2,
    FILLEDP21 = -1,
    FILLEDP22 = -2,
    BLACK = gameConstants.PLAYER_1_TURN_ID,
    WHITE = gameConstants.PLAYER_2_TURN_ID,

    VALID_TILES = [EMPTY, WHITE, BLACK];

function DotsAndBoxes(N){
  this.N = N - N % 2; // Ensure even size
}

function clone(board){
  return JSON.parse(JSON.stringify(board));
}

function getOpponentTileColor(tileColor){
  return tileColor === BLACK ? WHITE : BLACK;
}

DotsAndBoxes.prototype.validateBoard = function(boardArray){

  // TODO: why each tile in board array is string??
  return boardArray[0].length === (this.N * (this.N - 1)) && boardArray[1].length === (this.N * (this.N - 1));
}

DotsAndBoxes.prototype.isOnBoard = function(position){
  return position >= 0 && position < (this.N * (this.N - 1));
}

DotsAndBoxes.prototype.getStartingBoard = function(){

  var board = [];
  var boardHorizontal = [];
  var boardVertical = [];

  for (var x = 0; x < this.N * (this.N - 1); x++){
    boardHorizontal[x] = EMPTY;
    boardVertical[x] = EMPTY;
  }

  board = [
    boardHorizontal,
    boardVertical
  ]

  return board;
}

DotsAndBoxes.prototype.getValidMove = function(board, movement){
    // Movement debe de ser un arreglo que traiga en las posiciones:
    // 0: El numero identificador de el arreglo que desea modificar (0 o 1)
    // 1: El numero de posicion que desea marcar del arreglo elegido

    // We get arrays filled with the numbers of posiotions that are free
    var spacePositionToFill = [];
    var spacePositionHorizontalToFill = [];
    var spacePositionVerticalToFill = [];

    // If it's a balid board
    if(!this.validateBoard(board) ||

    // If it's a valid position
    !this.isOnBoard(movement[1])){
        return []
    }

    if(movement[0] === 0 && board[movement[0]][movement[1]] !== EMPTY){
        return [];
    }
    else if(movement[0] === 1 && board[movement[0]][movement[1]] !== EMPTY){
        return [];
    }
    else{
        spacePositionToFill = [
            spacePositionHorizontalToFill,
            spacePositionVerticalToFill
        ]

        return spacePositionToFill;
    }
};

DotsAndBoxes.prototype.getAllValidMoves = function(board){
    var validMoves = [];
    var validHorizontalMoves = [];
    var validVerticalMoves = [];

    for(var i = 0; i < board[0].length; i++){
        if(board[0][i] === EMPTY){
            validHorizontalMoves.push(i);
        }
        if(board[1][i] === EMPTY){
            validVerticalMoves.push(i);
        }
    }
    if(validHorizontalMoves.length > 0 || validVerticalMoves.length > 0){
        validMoves = [
            validHorizontalMoves,
            validVerticalMoves
        ]
    }
    return validMoves;
};

DotsAndBoxes.prototype.judge = function(board){
  var judgement = {};
  judgement[BLACK] = 0;
  judgement[WHITE] = 0;

  for(var i = 0; i < board[0].length; i++){
    if(board[0][i] === FILLEDP12){
      judgement[BLACK] = judgement[BLACK] + 2;
    }
    else if(board[0][i] === FILLEDP11){
      judgement[BLACK] = judgement[BLACK] + 1;
    }
    else if(board[0][i] === FILLEDP22){
      judgement[WHITE] = judgement[WHITE] + 2;
    }
    else if(board[0][i] === FILLEDP21){
      judgement[WHITE] = judgement[WHITE] + 1;
    }
  }

  for(var j = 0; j < board[1].length; j++)
  {
    if(board[1][j] === FILLEDP12){
      judgement[BLACK] = judgement[BLACK] + 2;
    }
    else if(board[1][j] === FILLEDP11){
      judgement[BLACK] = judgement[BLACK] + 1;
    }
    else if(board[1][j] === FILLEDP22){
      judgement[WHITE] = judgement[WHITE] + 2;
    }
    else if(board[1][j] === FILLEDP21){
      judgement[WHITE] = judgement[WHITE] + 1;
    }
  }

  return judgement;
}

DotsAndBoxes.prototype.play = function(game, player, movement, nextMoveCb, finishGameCb, errorCb){

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

    otherPlayer = game.player_2;
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
    // Se setea la repeticion del turno a falso
    var repetirTurno = false;

    // Deduct spaces that will be filled
    var positionsToFill = this.getValidMove(game.board, movement);

    if(positionsToFill.length > 0){
      // Fill space in board 
      var punteoAntesTurno = 0;
      var punteoTurno = 0;

      // Reiniciar contadores a 0
      var acumulador = 0;
      var contador = 0;
  
      for(var i = 0; i < game.board[0].length; i++){
          if(((i + 1) % this.N) !== 0){
              if(game.board[0][i] !== EMPTY && game.board[0][i + 1] !== EMPTY && game.board[1][contador + acumulador] !== EMPTY && game.board[1][contador + acumulador + 1] !== EMPTY){
                 punteoAntesTurno = punteoAntesTurno + 1;
              }
              acumulador = acumulador + this.N;
          }
          else{
              contador = contador + 1;
              acumulador = 0;
          }
      }

      game.board[movement[0]][movement[1]] = FILLED;

      // Reiniciar contadores a 0
      var acumulador = 0;
      var contador = 0;

      for(var i = 0; i < game.board[0].length; i++){
        if(((i + 1) % this.N) !== 0){
            if(game.board[0][i] !== EMPTY && game.board[0][i + 1] !== EMPTY && game.board[1][contador + acumulador] !== EMPTY && game.board[1][contador + acumulador + 1] !== EMPTY){
              punteoTurno = punteoTurno + 1;
            }
            acumulador = acumulador + this.N;
        }
        else{
            contador = contador + 1;
            acumulador = 0;
        }
      }

      if(punteoAntesTurno < punteoTurno){
          if(playingColor === BLACK){
              if((punteoTurno - punteoAntesTurno) === 2){
                game.board[movement[0]][movement[1]] = FILLEDP12;
              }
              else if((punteoTurno - punteoAntesTurno) === 1){
                game.board[movement[0]][movement[1]] = FILLEDP11;
              }
          }
          else if(playingColor === WHITE){
              if((punteoTurno - punteoAntesTurno) === 2){
                game.board[movement[0]][movement[1]] = FILLEDP22;
              }
              else if((punteoTurno - punteoAntesTurno) === 1){
                game.board[movement[0]][movement[1]] = FILLEDP21;
              }
          }
          repetirTurno = true;
      }

      // Augment movement number
      game.movementNumber++;
    }

    // Invalid movement
    else{
      // Repeat turn cause player did a invalid movement

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

    // Win a point
    if(repetirTurno){
      // Repeat turn cause player win a point

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
    var nextValidMoves = this.getAllValidMoves(game.board);

    // If there are valid movements for the defacto next player
    if(nextValidMoves.length > 0){

        // Update current turn
        game.currentTurn = otherTurnID;
    
        // He should play next
        nextMoveCb(game, otherPlayer);
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
            game.winner = game.player_2;
            game.loser = game.player_1;
            }

            // Update wins and loses
            game.winner.wins++;
            game.loser.loses++;
        }

        // Set game as finished
        game.status = gameConstants.STATUS.finished;

        // Finish game callback
        finishGameCb(game, game.winner);
    }
  }
  else{
    errorCb({
      status: 400,
      message: 'Incongruent turn'
    });
  }
}

module.exports = DotsAndBoxes;