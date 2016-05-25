var sockets = {};

sockets.init = function (http, cb) {

  // Socket setup
  var io = require('socket.io')(http);

  // Each time new socket connection is open
  io.on('connection', function (socket) {

    // Report connection
    console.log('New connection open');

    // Notify socket creation
    cb(socket);

  });

}

module.exports = sockets;