var Room = require("./room");
var Table = require("./table");
var Game = require("./game");
var Player = require("./player");

var room = new Room("Test Room");
var table = new Table(1);

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

exports.add_new_player_to_game = function(id, name, game_id){
    var player = new Player(id, name);
    active_games[game_id].add_player(player);
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