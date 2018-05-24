function Player(id, user_name, socket){
  this.id = id;
  this.user_name = user_name;
  this.socket = socket;

  this.available = true;
  this.ranking = 0; // TODO: retrieve from DB
  this.wins = 0;
  this.loses = 0;
  this.draws = 0;
  this.ip = socket.request.connection.remoteAddress;
}

module.exports = Player;
