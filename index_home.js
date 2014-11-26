var express = require("express");
var app = express();
var http = require('http');
var port = process.env.PORT || 3000;
var io = require('socket.io').listen(app.listen(port));
var game_logic = require('./gameLogic');

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
//app.use(express.bodyParser());

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
    var players = game_logic.get_public_players_from_game(game_id);
    res.render("newgame", {player: {name: player_name, id: player_id }, game_id: 1, players: players});
});

//changee to post later
app.get('/join', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var player_id = query['player_id'];
    var player_name = query['player_name'];
    var game_id = 1;
    game_logic.add_new_player_to_game(player_id, player_name, game_id);
    var game = game_logic.game(game_id);
    var players = game_logic.get_public_players_from_game(game_id);
    res.render("joingame", {player: {name: player_name, id: player_id }, game_id: 1, players: players, game_settings: game.get_settings()});
});


io.of('/avalon').on('connection', function(socket){
    var player_id;
    var socket_rooms = [];

    socket.on('joined', function(data){
        var game_id = data['game_id'];
        player_id = data['player']['id'];
        socket.join(game_id);
        socket_rooms.push(game_id);
        socket.broadcast.to(game_id).emit('player_joined', data);
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
        var game_players = game_logic.get_players_from_game(game_id);
        data['players'] = game_players;
        io.of('/avalon').to('lobby').emit('new_game_started_lobby', data);
    });

    socket.on('disconnect', function() {
        console.log('REMOVING!?');
        var reconnect_time = 0;
        //setTimeout(function(){
            for(var i = 0; i < socket_rooms.length; i++){
                io.of('/avalon').to(socket_rooms[i]).emit('player_left', player_id);
                var game = game_logic.game(socket_rooms[i]);
                game.remove_player(player_id);
            }
        //}, reconnect_time);
    });

    socket.on('toggle_ready', function(data){
        var game_id = data['game_id'];
        player_id = data['player_id'];
        var game = game_logic.game(game_id);
        game.toggle_ready(player_id);
        socket.broadcast.to(game_id).emit('player_toggled_ready', player_id);
    });
});

console.log("Listening on port " + port);