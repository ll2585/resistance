var Room = require("./room");
var Table = require("./table");
var Game = require("./game");
var Player = require("./player");

var room = new Room("Test Room");
var table = new Table(1);
var game_constants = Game.get_constants();
var active_games = {};
var game_flags = {};

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
    var game = active_games[game_id];
    var player;
    if('id' in options && 'name' in options) {
        var id = options['id'];
        var name = options['name'];
        player = new Player(id, name);

    }else if('player' in options){
        player = options['player'];

    }

    game.add_player(player);
};

exports.player_is_random = function(player){
    return player.get_attribute('random');
};

exports.game_flags = function(){
    return this.game_flags;
};
exports.game_settings = function(){
    return this.game_settings;
};
exports.set_game_flag = function(game_id, flag){ //only true false
    if(!(game_id in this.game_flags)){
        this.game_flags[game_id] = {};
    }
    var game_flag_by_game_id = this.game_flags[game_id];
    game_flag_by_game_id[flag] = true;
};
exports.has_game_flag = function(game_id, flag){ //only true false
    if(!(game_id in this.game_flags)){
        this.game_flags[game_id] = {};
    }
    var game_flag_by_game_id = this.game_flags[game_id];
    return flag in game_flag_by_game_id;
};
exports.remove_game_flag = function(game_id, flag){ //only true false
    if(!(game_id in this.game_flags)){
        this.game_flags[game_id] = {};
    }
    var game_flag_by_game_id = this.game_flags[game_id];
    if(flag in game_flag_by_game_id){
        delete game_flag_by_game_id[flag];
    }
};
exports.set_game_setting = function(game_id, setting, value){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    game_setting_by_game_id[setting] = value;
};

/* special setting
 */
exports.make_player_waiting_for = function(game_id, player_id, setting){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(!(setting in game_setting_by_game_id)){
        game_setting_by_game_id[setting] = [];
    }
    var game_setting = game_setting_by_game_id[setting];
    if(game_setting.indexOf(player_id) == -1){
        game_setting.push(player_id);
    }
};

exports.all_players_waiting_for = function(game_id, setting){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(!(setting in game_setting_by_game_id)){
        return false;
    }
    var game_setting = game_setting_by_game_id[setting];
    var total_players_waiting_for = exports.game(game_id).get_number_of_human_players();
    return game_setting.length == total_players_waiting_for;
};
/* end special setting
 */

exports.select_random_players = function(game){
    var game_players = game.get_player_ids();
    var team_size = game.get_current_round()['team_size'];
    var random_players = [];
    while(random_players.length < team_size){
        var player_id = game_players[Math.floor(Math.random()*game_players.length)];
        if(random_players.indexOf(player_id) == -1){
            random_players.push(player_id);
        }
    }
    return random_players;
};

exports.random_vote = function(player){
    return 'Approve';
    //return (Math.floor(Math.random() * 2) == 0) ? 'Approve' : 'Reject';
};
exports.random_mission = function(player){
    return 'Success';
    //return (Math.floor(Math.random() * 2) == 0) ? 'Success' : 'Fail';
};
exports.random_bot = function(){
    var names_array = ['Merlin', 'Berlin', 'Gerlin', 'Herlin', 'Zerlin', 'Lerlin', 'Perlin', 'Serlin', 'Cerlin', 'Derlin', 'Erlin', 'Aerlin', 'Ferlin', 'Ierlin'];
    var name = names_array[Math.floor(Math.random()*names_array.length)];
    var id = Math.floor(Math.random() * (1 - 1000 + 1)) + 1;
    var player_id = name + '_' + id.toString();
    var player = new Player(player_id, name);
    player.set_attributes('random', true);
    player.set_attributes('bot', true);
    return player;
};

exports.get_players_from_game = function(game_id){
    return active_games[game_id].get_players();
};

exports.game = function(game_id){
    return active_games[game_id];
};

/* ASSASSINATION MECHANICS FOR BOTS
 */
exports.get_random_player_id = function(game_id){
    var game = exports.game(game_id);
    var game_player_ids = game.get_player_ids();
    var player_id = game_player_ids[Math.floor(Math.random()*game_player_ids.length)];
    return player_id;
};
exports.assassin_is_bot = function(game_id){
    var game = exports.game(game_id);
    var game_player_ids = game.get_player_ids();
    for(var i = 0; i < game_player_ids.length; i++){
        var player_id = game_player_ids[i];
        if(game.get_player_role(player_id) == game_constants['assassin'] && game.player_id_is_bot(player_id)){
            return true;
        }
    }
    return false;
};
exports.bot_assassin_has_not_assassinated_yet = function(game_id){
    var bot_assassin_assassinated_flag = 'bot_assassin_assassinated';
    return !(exports.has_game_flag(game_id, bot_assassin_assassinated_flag));
};
exports.player_is_evil_by_id = function(game_id, player_id){
    var game = exports.game(game_id);
    return game.is_spy(player_id);
};
exports.set_bot_assassin_to_assassinate = function(game_id){
    var bot_assassin_assassinated_flag = 'bot_assassin_assassinated';
    exports.set_game_flag(game_id, bot_assassin_assassinated_flag);
};
exports.clear_bot_assassin_flag = function(game_id){
    var bot_assassin_assassinated_flag = 'bot_assassin_assassinated';
    exports.remove_game_flag(game_id, bot_assassin_assassinated_flag);
};
/* END ASSASSINATION MECHANICS
 */

exports.get_public_players_from_game = function(game_id){
    return active_games[game_id].get_public_players();
};

exports.get_evil_players = function(num_players){
    return game_constants['red_count'][num_players];
};
exports.get_constants = function(){
    return game_constants;
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