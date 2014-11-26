var blue_roles = ['Merlin', 'Percival', 'Good_Lancelot'];
var red_roles = ['Mordred', 'Oberon', 'Morgana', 'Bad_Lancelot'];
var red_count = {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4};
var blue_count = {5: 3, 6: 4, 7: 4, 8: 5, 9: 6, 10: 6};
var mission_1 = {5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3};
var mission_2 = {5: 3, 6: 3, 7: 3, 8: 4, 9: 4, 10: 4};
var mission_3 = {5: 2, 6: 4, 7: 3, 8: 4, 9: 4, 10: 4};
var mission_4 = {5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 5};
var mission_5 = {5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 5};

function Game() {
  this.players = [];
  this.players_id = {};
  this.settings = {Merlin: false, Percival: false, Good_Lancelot: false, Mordred: false, Oberon: false, Morgana: false, Bad_Lancelot: false, Lady_of_the_Lake: false, Excalibur: false};
  this.player_buffer = [];
  this.started = false;
  this.player_count = -1;
  this.two_fails = false;
  this.current_mission = -1;
  this.current_vote = -1;
  this.leader;
  this.proposed_team = [];
  this.votes = [];
  this.red_roles = [];
  this.blue_roles = [];
  this.assigned_roles = {};


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

Game.prototype.add_to_buffer = function(player_id) {
  this.player_buffer.push(player_id);
};
Game.prototype.in_game = function(player_id) {
  return player_id in this.players_id;
};
Game.prototype.in_buffer = function(player_id) {
  return this.player_buffer.indexOf(player_id) > -1;
};

Game.prototype.remove_from_buffer = function(player_id) {
  var index = this.player_buffer.indexOf(player_id);
  if (index > -1) {
    this.player_buffer.splice(index, 1);
  }
};

Game.prototype.start = function() {
  if(!this.started){
    var all_roles = [];
    this.player_count = this.players.length;
    var num_reds = red_count[this.player_count];
    var num_blues = blue_count[this.player_count];
    var reds = [];
    for(var i = 0; i < red_roles.length; i++){
      if(this.settings[red_roles[i]]){
        reds.push(red_roles[i]);
      }
    }
    if(reds.length < num_reds && this.settings['Merlin']){
      reds.push('Assassin');
    }
    while(reds.length < num_reds){
      reds.push('Vanilla Red');
    }
    this.red_roles = reds;


    var blues = [];
    for(var i = 0; i < blue_roles.length; i++){
      if(this.settings[blue_roles[i]]){
        blues.push(blue_roles[i]);
      }
    }
    while(blues.length < num_blues){
      blues.push('Vanilla Blue');
    }
    this.blue_roles = blues;

    for(var i = 0; i < reds.length; i++){
      all_roles.push(reds[i]);
    }
    for(var i = 0; i < blues.length; i++){
      all_roles.push(blues[i]);
    }
    all_roles = shuffle(all_roles);
    for(player_id in this.players_id){
      this.assigned_roles[player_id] = all_roles.pop();
    }
    this.started = true;
  }
};


//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

Game.prototype.need_two_fails = function() {
  return this.current_mission == 4 && this.player_count >= 7;
};
module.exports = exports = Game;