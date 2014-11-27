var Room = require("./room");
var Table = require("./table");
var Game = require("./game");
var Player = require("./player");

var room = new Room("Test Room");
var table = new Table(1);
var game_constants = Game.get_constants();
var active_games = {};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

exports.has_games = function(){
    console.log(active_games);
    var num_of_active_games = Object.keys(active_games).length;
    return num_of_active_games > 0;
};

exports.start_game = function(id){
    var game = new Game();
    active_games[id] = game;
};

exports.add_new_player_to_game = function(game_id, options){
    if('id' in options && 'name' in options) {
        var id = options['id'];
        var name = options['name'];
        var player = new Player(id, name);
        active_games[game_id].add_player(player);
    }else if('player' in options){
        var player = options['player'];
        active_games[game_id].add_player(player);
    }
};

exports.player_is_random = function(player){
    return player.get_attribute('random');
};
exports.random_vote = function(player){
    return (Math.floor(Math.random() * 2) == 0) ? 'Approve' : 'Reject';
};
exports.random_mission = function(player){
    return (Math.floor(Math.random() * 2) == 0) ? 'Success' : 'Fail';
};
exports.random_bot = function(){
    var names_array = ['Merlin', 'Berlin', 'Gerlin', 'Herlin', 'Zerlin', 'Lerlin', 'Perlin', 'Serlin', 'Cerlin', 'Derlin', 'Erlin', 'Aerlin', 'Ferlin', 'Ierlin'];
    var name = names_array[Math.floor(Math.random()*names_array.length)];
    var id = Math.floor(Math.random() * (1 - 1000 + 1)) + 1;
    var player_id = name + '_' + id.toString();
    var player = new Player(player_id, name);
    player.set_attributes('random', true);
    return player;
};

exports.get_players_from_game = function(game_id){
    return active_games[game_id].get_players();
};

exports.game = function(game_id){
    return active_games[game_id];
};

exports.get_public_players_from_game = function(game_id){
    return active_games[game_id].get_public_players();
};

exports.get_evil_players = function(num_players){
    return game_constants['red_count'][num_players];
};

exports.needs_two_fails = function(num_players){
    return num_players>= 7;
};

exports.get_mission_player_count = function(num_players){
    var missions = {};
    for(var mission in game_constants['missions']){
        missions[mission] = game_constants['missions'][mission][num_players];
    }
    return missions;
};