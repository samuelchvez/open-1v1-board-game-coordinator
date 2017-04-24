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

Copyright (c) 2017 Samuel Chávez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

