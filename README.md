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


## Contributors

[@samuelchvez](https://github.com/samuelchvez)

## License

TODO
