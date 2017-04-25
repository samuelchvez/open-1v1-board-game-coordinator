# Open 1v1 Board Game Coordinator

With a simple protocol, this project allows to create leagues for 1v1 board games. It's easily extensible for any game but it comes with default othello game.

## Installation

- git clone
- npm install

## Run

Assuming you run it from a terminal within the main folder:

```
node ./bin/www --tid=12 --rrt=2 --game=othello
```

## Arguments

- **tid** (required): tournament id. Choose any positive integer.
- **rrt** (required): number of re-matches in a round robin fashion (normally 2).
- **game** (required): game identifier, currently only supports "othello".

## Protocol Specification 1.0

This game coordinators exposes a simple socket interface to play leagues of 1v1 board games. The following steps are needed to play with this coordinator (examples assuming the use of javascript [Socket.io](https://socket.io/) for the client side):

### Connect (on connect)

Use your client api to sign in to the coordinator exposed service:

```Javascript
var socket = require('socket.io-client')(URL);  // for example: http://127.0.0.1:3000
socket.on('connect', function(){});
```

### Sign-in (emmit signin)

After the connection callback, you should register your player, for example:

```Javascript
socket.on('connect', function(){
  socket.emit('signin', {
    user_name: "gallanghof",
    tournament_id: 1234,
    user_role: 'player'
  });
});
```

#### Sign-in params
- **user_name**: string, fully qualified javascript id for your username (ie. no spaces, starting with letter, etc.)
- **tournament_id**: int, positive integer to the League you are connecting with.
- **user_role**: string, send "player".

### Waited signals

After the signin signal is emitted, your socket must wait for any of the following three signals:

#### Ok signin (on ok_signin)

Notifies when the signin process was successful. No further action is required after this signal.

```Javascript
socket.on('ok_signin', function(){
  console.log("Successfully signed in!");
});
```

#### Ready (on ready)

This signal is sent when the coordinators tells you should play.

```Javascript
socket.on('ready', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var board = data.board;
});
```

##### Ready received params
- **game_id**: int, integer representing the id of the game playing.
- **player_turn_id**: int, 1 for player 1, 2 for player 2.
- **board**: [int], 1D array of integers, containing the board representation.

#### Finish (on finish)

This signal is sent when the coordinators tells you the game you were playing has finished.

```Javascript
socket.on('finish', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;
});
```

### Playing and resetting the board

In order to play and reset the boar, you should emit two signals:

### Play (emit play)

After the ready signal is received, you should play your turn, for example:

```Javascript
socket.on('ready', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var board = data.board;
  
  // TODO: Your logic / user input here
  
  socket.emit('play', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID,
    movement: ?
  });
});
```

#### Play params
- **tournament_id**: int, positive integer to the League you are connecting with.
- **player_turn_id**: int, 1 for player 1, 2 for player 2, but you can simply echo what you received from the ready signal.
- **game_id**: int, integer representing the id of the game playing.
- **movement**: ?, any type representing the movement of the specific game you are playing. For instance, othello only needs an integer representing the tile clicked. 


### Player ready (emit player_ready)

After the finish signal is received, you should reset your availability for your player. This enables the coordinator to match you agains other player. For example:

```Javascript
socket.on('finish', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;
  
  // TODO: Your cleaning board logic here
  
  socket.emit('player_ready', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID
  });
});
```

## Contributors

[@samuelchvez](https://github.com/samuelchvez)

## License

Copyright (c) 2017 Samuel Chávez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

