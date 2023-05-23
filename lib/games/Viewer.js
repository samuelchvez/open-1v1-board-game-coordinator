function Viewer(id, user_name, socket) {
  this.id = id;
  this.user_name = user_name;
  this.socket = socket;

  this.ip = socket.request.connection.remoteAddress;
}

module.exports = Viewer;
