var express = require("express");
var app = express();
var http = require('http');
var port = process.env.PORT || 3000;
var io = require('socket.io').listen(app.listen(port));
var game_logic = require('./gameLogic');
var bodyParser = require('body-parser');

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

//app.use(cookieParser);
//app.use(express.session({
//   store: sessionStore,
//    cookie: {
//        httpOnly: true
//    },
//    key: EXPRESS_SID_KEY
//}));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
    console.log(req.session);
    res.render("gamelobby", {player: {name: "req.session.name", id: "req.session.id" }, games_started: game_logic.has_games()});
});

//changee to post later
app.get('/create', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var player_id = query['player_id'];
    var player_name = query['player_name'];
    var game_id = 1;
    game_logic.start_game(game_id);
    game_logic.add_new_player_to_game(player_id, player_name, game_id);

    //add 4 dummy players cus fuck it
    game_logic.add_new_player_to_game(2, 'Merlin', game_id);
    game_logic.add_new_player_to_game(3, "berlin", game_id);
    game_logic.add_new_player_to_game(4, 'GErlin', game_id);
    game_logic.add_new_player_to_game(5, 'Werlion', game_id);

    var players = game_logic.get_public_players_from_game(game_id);
    res.render("newgame", {player: {name: player_name, id: player_id }, game_id: 1, players: players});
});

//changee to post later
app.post('/play', function(req, res){
    var player_id = req.body.player_id;
    var player_name = req.body.player_name;
    var game_id = req.body.game_id;
    console.log(player_id + ' and ' + player_name + ' and ' + game_id);
    var game = game_logic.game(game_id);
    game.add_to_buffer(player_id); //so it doesn't say you disconnected
    var players = game_logic.get_public_players_from_game(game_id);
    console.log(game.assigned_roles);
    var role = game.assigned_roles[player_id];
    var roles = game.assigned_roles;
    res.render("game", {player: {name: player_name, id: player_id }, game_id: game_id, players: players, role: role, roles:roles});
});

//changee to post later
app.get('/join', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var player_id = query['player_id'];
    var player_name = query['player_name'];
    var game_id = 1;
    var game = game_logic.game(game_id);

    if(game.in_game(player_id)){
        console.log('TO BUFFER');
        game.add_to_buffer(player_id);
    }else{
        console.log('ok join game');
        game_logic.add_new_player_to_game(player_id, player_name, game_id);
    }
    var players = game_logic.get_public_players_from_game(game_id);
    console.log('LOL');
    res.render("joingame", {player: {name: player_name, id: player_id }, game_id: 1, players: players, game_settings: game.get_settings()});
});


io.of('/avalon').on('connection', function(socket){
    var player_id;
    var socket_rooms = [];

    socket.on('joined', function(data){
        var game_id = data['game_id'];
        player_id = data['player']['id'];
        var game = game_logic.game(game_id);
        socket.join(game_id);
        socket_rooms.push(game_id);
        if(!game.in_buffer(player_id)){
            console.log('ok join it now');
            socket.broadcast.to(game_id).emit('player_joined', data);
        }else{
            game.remove_from_buffer(player_id);
        }
});

    socket.on('joined_lobby', function(){
        socket.join('lobby');
    });

    console.log('a user connected');
    socket.on('remove_role', function(data){
        var game_id = data['game_id'];
        game_logic.game(game_id).remove_role(data['role']);
        io.of('/avalon').to('lobby').emit('removed_role', data);
        io.of('/avalon').to(game_id).emit('removed_role', data);
        console.log(data);
    });

    socket.on('add_role', function(data){
        //send to room and to lobby
        var game_id = data['game_id'];
        game_logic.game(game_id).add_role(data['role']);
        io.of('/avalon').to('lobby').emit('added_role', data);
        io.of('/avalon').to(game_id).emit('added_role', data);
        console.log(data);
    });

    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });

    socket.on('new_game_started', function (data) {
        var game_id = data['game_id'];
        data['players'] = game_logic.get_players_from_game(game_id);
        io.of('/avalon').to('lobby').emit('new_game_started_lobby', data);
    });

    socket.on('disconnect', function() {
        var reconnect_time = 10;
        setTimeout(function(){
            for(var i = 0; i < socket_rooms.length; i++){
                var game_id = socket_rooms[i];
                var game = game_logic.game(socket_rooms[i]);
                if(game.in_buffer(player_id)){//then you refreshed
                    console.log('fucker refreshed');
                }else{//you left
                    game.remove_player(player_id);
                    io.of('/avalon').to(game_id).emit('player_left', player_id);
                }
            }
        }, reconnect_time);
    });

    socket.on('toggle_ready', function(data){
        var game_id = data['game_id'];
        player_id = data['player_id'];
        var game = game_logic.game(game_id);
        game.toggle_ready(player_id);
        socket.broadcast.to(game_id).emit('player_toggled_ready', player_id);
    });

    socket.on('start_game', function(game_id){
        io.of('/avalon').to(game_id).emit('game_started', game_id);
        var game = game_logic.game(game_id);
        game.start();
    });
});

console.log("Listening on port " + port);