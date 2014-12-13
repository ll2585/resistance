var Room = require("./room");
var Table = require("./table");
var Game = require("./game");
var Player = require("./player");

var room = new Room("Test Room");
var table = new Table(1);
var game_constants = Game.get_constants();
var active_games = {};
var game_flags = {};
var game_data = {};

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

//refactor this shit since i changed it when i made ethe lobby stuff and the game stuff (role vs setting etc.)
exports.get_open_games = function(){
    var result = [];
    for(var id in active_games){
        if (!active_games[id].started){
            console.log("********************");
            console.log(active_games[id].get_settings());
            var good_roles = {Merlin: {}, Percival: {}, Good_Lancelot: {}};
            var bad_roles = {Mordred: {}, Oberon: {}, Morgana: {}, Bad_Lancelot: {}};
            var items = {Lady_of_the_Lake: {}, Excalibur: {}};
            var good_guys_images = {Merlin: 'images/merlin.png', Percival: 'images/percival.png', Good_Lancelot: 'images/goodlancelot.png'};
            var bad_guys_images = {Mordred: 'images/mordred.png', Oberon: 'images/oberon.png', Morgana: 'images/morgana.png', Bad_Lancelot: 'images/evillancelot.png'};
            var item_images = {Lady_of_the_Lake: 'images/ladyofthelake.png', Excalibur: 'images/excalibur.png'};
            var good_roles_on = {Merlin: {}, Percival: {}, Good_Lancelot: {}};
            var bad_roles_on = {Mordred: {}, Oberon: {}, Morgana: {}, Bad_Lancelot: {}};
            var items_on = {Lady_of_the_Lake: {}, Excalibur: {}};
            for(var role in good_roles_on){
                good_roles_on[role]['enabled'] = active_games[id].get_settings()[role];
                good_roles_on[role]['image'] = good_guys_images[role];
            }
            for(var role in bad_roles_on){
                bad_roles_on[role]['enabled'] = active_games[id].get_settings()[role];
                bad_roles_on[role]['image'] = bad_guys_images[role];
            }
            for(var item in items_on){
                items_on[item]['enabled'] = active_games[id].get_settings()[item];
                items_on[item]['image'] = item_images[item];
            }
            var get_roles = {good_roles: good_roles_on, bad_roles: bad_roles_on, items: items_on};
            console.log("********************");
            console.log(get_roles);
            result.push({game_id: id, roles: get_roles});
        }
    }
    return result;
};

exports.get_next_five_leaders = function(game_id){
    //returns names
    var game = active_games[game_id];
    var result = [];
    result = game.get_next_player_name_count(5);
    console.log("GETTING VIEES");
    console.log(result);
    return result;
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
exports.set_last_mission = function(game_id, data){
    if(!(game_id in game_data)){
        game_data[game_id] = {};
    }
    if(!('last_mission' in game_data[game_id])){
        game_data[game_id]['last_mission'] = {};
    }
    game_data[game_id]['last_mission'] = data;
};
exports.set_assassination_results = function(game_id, data){
    if(!(game_id in game_data)){
        game_data[game_id] = {};
    }
    if(!('assassination_results' in game_data[game_id])){
        game_data[game_id]['assassination_results'] = {};
    }
    game_data[game_id]['assassination_results'] = data;
};

exports.get_last_mission = function(game_id){
    return game_data[game_id]['last_mission'];
};
exports.get_assassination_results = function(game_id){
    return game_data[game_id]['assassination_results'];
};
exports.set_last_vote = function(game_id, data){
    console.log('!!!!!!!!!!!!!!!!!!!!!!1');
    console.log('set last vote');
    if(!(game_id in game_data)){
        game_data[game_id] = {};
    }
    if(!('last_vote' in game_data[game_id])){
        game_data[game_id]['last_vote'] = {};
    }
    game_data[game_id]['last_vote'] = data;

};

exports.get_last_vote = function(game_id){
    return game_data[game_id]['last_vote'];
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
exports.clear_game_setting = function(game_id, setting){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(setting in game_setting_by_game_id) {
        delete game_setting_by_game_id[setting];
    }
};
exports.get_game_setting = function(game_id, setting){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(setting in game_setting_by_game_id) {
        return game_setting_by_game_id[setting];
    }else{
        return null;
    }
};
function get_random_color(){
    var color_universe = ['#1CE6B9', '#53007F', '#FFFC02', '#FE8A0E', '#1BA201', '#E55BB0', '#959697', '#7EBFF1', '#106246', '#4E2A04'];
    return color_universe[Math.floor(Math.random()*color_universe.length)];
}
exports.assign_player_colors = function(game_id){
    var game_players = this.get_players_from_game(game_id); //returns array of players
    var num_players = game_players.length;
    var colors_to_use = [];
    while(colors_to_use.length < num_players){
        var random_color = get_random_color();
        while(colors_to_use.indexOf(random_color) != -1){
            random_color = get_random_color();
        }
        colors_to_use.push(random_color);
    }
    var player_color_id_dict = {};
    var player_color_name_dict = {};
    for(var i = 0; i < game_players.length; i++){
        var player_id = game_players[i].id;
        var player_name = game_players[i].name;
        player_color_id_dict[player_id] = colors_to_use[i];
        player_color_name_dict[player_name] = colors_to_use[i];
    }
    this.set_game_setting(game_id, 'player_colors_by_id', player_color_id_dict);
    this.set_game_setting(game_id, 'player_colors_by_name', player_color_name_dict);
};
exports.get_player_colors = function(game_id){
    var id_dict = this.get_game_setting(game_id, 'player_colors_by_id');
    var name_dict = this.get_game_setting(game_id, 'player_colors_by_name');
    console.log(id_dict);
    return [id_dict, name_dict];
};
/* special setting
 */
exports.player_reveals_role = function(game_id, player_id){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(!('player_roles' in game_setting_by_game_id)){
        game_setting_by_game_id['player_roles'] = {};
    }
    var game_setting = game_setting_by_game_id['player_roles'];
    var game = exports.game(game_id);
    if(!(player_id in game_setting)){
        game_setting[player_id] = game.get_player_role(player_id);
    }
};
exports.get_revealed_roles = function(game_id){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(!('player_roles' in game_setting_by_game_id)){
        game_setting_by_game_id['player_roles'] = {};
    }
    var game_setting = game_setting_by_game_id['player_roles'];
    return game_setting;
};

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

exports.clear_players_waiting_for = function(game_id, setting){
    if(!(game_id in this.game_settings)){
        this.game_settings[game_id] = {};
    }
    var game_setting_by_game_id = this.game_settings[game_id];
    if(setting in game_setting_by_game_id){
        delete game_setting_by_game_id[setting];
    }
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
    //return 'Success';
    return (Math.floor(Math.random() * 2) == 0) ? 'Success' : 'Fail';
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
exports.random_game_id = function(){
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 12;
    var random_string = '';
    for (var i = 0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        random_string += chars.substring(rnum,rnum+1);
    }
    return random_string;
};
exports.game = function(game_id){
    return active_games[game_id];
};

/* ASSASSINATION MECHANICS FOR BOTS
 */
exports.get_player_id_from_role = function(game_id, role){
    var game = exports.game(game_id);
    var game_player_ids = game.get_player_ids();
    for(var i = 0; i < game_player_ids.length; i++){
        var player_id = game_player_ids[i];
        if(game.get_player_role(player_id) == game_constants[role]){
            return player_id;
        }
    }
    return null;
};
exports.get_assassin = function(game_id){
    var game = exports.game(game_id);
    var game_player_ids = game.get_player_ids();
    for(var i = 0; i < game_player_ids.length; i++){
        if(game.get_player_role(game_player_ids[i]) == game_constants['assassin']){
            return game_player_ids[i];
        }
    }
};
exports.player_id_is_role = function(game_id, player_id, role){
    var game = exports.game(game_id);
    var game_player_ids = game.get_player_ids();
    return game.get_player_role(player_id) == game_constants[role];
};
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