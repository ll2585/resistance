function Game() {
  this.players = [];
  this.players_id = {};
  this.settings = {Merlin: false, Percival: false, Good_Lancelot: false, Mordred: false, Oberon: false, Morgana: false, Bad_Lancelot: false, Lady_of_the_Lake: false, Excalibur: false};
}


Game.prototype.add_player = function(player) {
  this.players_id[player.id] = player;
  this.players.push(player);
  console.log('!!!!!!!! ADDDING PLAYTER');
  console.log(this.players);
};

Game.prototype.get_players = function() {
  return this.players;
};
Game.prototype.get_public_players = function() {
  var players = [];
  for(var i = 0; i <this.players.length; i++){
    players.push(this.players[i].public_data());

  }
  return players;
};
Game.prototype.add_role = function(role) {
  this.settings[role] = true;
};
Game.prototype.remove_role = function(role) {
  this.settings[role] = false;
};
Game.prototype.get_settings = function() {
  return this.settings;
};
Game.prototype.remove_player = function(player_id) {
  console.log('remove fucker ' + player_id);
  delete this.players_id[player_id];
  for(var i = 0; i < this.players.length; i++){
    if (this.players[i].id == player_id){
      console.log('fucker is at ' + i);
      this.players.splice(i, 1);
      break;
    }
  }
  console.log(this.players);
};
Game.prototype.toggle_ready = function(player_id) {
  this.players_id[player_id].toggle_ready();
};
module.exports = exports = Game;