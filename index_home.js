var express = require("express");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var app = express();
var http = require('http');
var port = process.env.PORT || 3000;
var io = require('socket.io').listen(app.listen(port));
var game_logic = require('./gameLogic');
var bodyParser = require('body-parser');

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/test';
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    store: new MongoStore({
        db: 'express',
        url: mongoUri,
        collection: 'session'
    }),
    resave: false,
    saveUninitialized: true
    }
));
/*
var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/test';
var sessionStore = new MongoStore({
    url: mongoUri
});
var EXPRESS_SID_KEY = 'express.sid';
app.use(cookieParser);
app.use(session({
    secret: 'THIS IS A SECRET',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
}));
*/
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/login", function(req, res){
    res.render("main");
});
app.post('/red', function(req, res){
    req.session.name = req.body.name;
    req.session.isLogged = true;
    res.redirect("/");
});
app.get('/', function(req, res){
    console.log(req.session);
    if (!req.session.name) {
        res.redirect("/login");
    }else {
        res.render("gamelobby", {
            player: {name: req.session.name, id: req.session.id},
            games_started: game_logic.has_games()
        });
    }
});
//changee to post later
app.post('/create', function(req, res){
    show_create_page(req, res);
});
app.post('/m/create', function(req, res){
    show_create_page_mobile(req, res);
});
function show_create_page_mobile(req, res){
    if (!req.session.name) {
        res.redirect("/login");
    }else {
        var player_id = req.session.id;
        var player_name = req.session.name;
        var game_id = game_logic.random_game_id();
        game_logic.start_game(game_id);
        console.log("STARTING GAME " + game_id);
        game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

        //add 4 dummy players cus fuck it
        var bots_to_add = 3;
        var game = game_logic.game(game_id);
        for (var i = 0; i < bots_to_add; i++) {
            var bot = game_logic.random_bot();
            var bot_name = bot.get_name();
            console.log("THE BOT IS " + bot_name);
            console.log(game.player_name_exists(bot_name));
            while (game.player_name_exists(bot_name)) {
                bot = game_logic.random_bot();
                bot_name = bot.get_name();
                console.log(bot_name);
            }
            bot.toggle_ready();
            game_logic.add_new_player_to_game(game_id, {player: bot});
        }

        var players = game_logic.get_public_players_from_game(game_id);
        res.render("newgame_mobile", {player: {name: player_name, id: player_id}, game_id: game_id, players: players});
    }
}

function show_create_page(req, res){
    if (!req.session.name) {
        res.redirect("/login");
    }else {
        var player_id = req.session.id;
        var player_name = req.session.name;
        var game_id = game_logic.random_game_id();
        game_logic.start_game(game_id);
        console.log("STARTING GAME " + game_id);
        game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

        //add 4 dummy players cus fuck it
        var bots_to_add = 3;
        var game = game_logic.game(game_id);
        for (var i = 0; i < bots_to_add; i++) {
            var bot = game_logic.random_bot();
            var bot_name = bot.get_name();
            console.log("THE BOT IS " + bot_name);
            console.log(game.player_name_exists(bot_name));
            while (game.player_name_exists(bot_name)) {
                bot = game_logic.random_bot();
                bot_name = bot.get_name();
                console.log(bot_name);
            }
            bot.toggle_ready();
            game_logic.add_new_player_to_game(game_id, {player: bot});
        }

        var players = game_logic.get_public_players_from_game(game_id);
        res.render("newgame", {player: {name: player_name, id: player_id}, game_id: game_id, players: players});
    }
}

//changee to post later
app.post('/play', function(req, res){
    if (!req.session.name) {
        res.redirect("/login");
    }else {
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
        var num_players = game.get_number_of_players();
        var mission_player_count = game_logic.get_mission_player_count(num_players);
        var two_fails_needed = game_logic.needs_two_fails(num_players);
        var evil_players = game_logic.get_evil_players(num_players);
        res.render("game", {
            player: {name: player_name, id: player_id},
            game_id: game_id, players: players, role: role, roles: roles,
            game: {
                mission_player_count: mission_player_count,
                two_fails_needed: two_fails_needed,
                num_players: num_players,
                evil_players: evil_players
            }
        });
    }
});

app.get('/play', function(req, res){
    var player_id = 'luke_id';
    var player_name = 'Luke';
    var game_id = game_logic.random_game_id() + '_bots';
    game_logic.start_game(game_id);
    game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

    //add 6 dummy players cus fuck it
    var bots_to_add = 6;
    var game = game_logic.game(game_id);
    for(var i = 0; i < bots_to_add; i++){
        var bot = game_logic.random_bot();
        var bot_name = bot.get_name();
        console.log("THE BOT IS " + bot_name);
        console.log(game.player_name_exists(bot_name));
        while(game.player_name_exists(bot_name)){
            bot = game_logic.random_bot();
            bot_name = bot.get_name();
            console.log(bot_name);
        }
        game_logic.add_new_player_to_game( game_id, {player: bot});
    }

    console.log(player_id + ' and ' + player_name + ' and ' + game_id);

    game.add_role('Merlin'); //add merlin
    game.add_role('Morgana'); //add merlin
    game.add_role('Mordred'); //add merlin
    game.add_role('Percival'); //add merlin
    game.start();
    game.add_to_buffer(player_id); //so it doesn't say you disconnected
    var players = game_logic.get_public_players_from_game(game_id);
    console.log(game.assigned_roles);
    var role = game.assigned_roles[player_id];
    var roles = game.assigned_roles;
    var num_players = game.get_number_of_players();
    var mission_player_count = game_logic.get_mission_player_count(num_players);
    var two_fails_needed = game_logic.needs_two_fails(num_players);
    var evil_players = game_logic.get_evil_players(num_players);
    res.render("game", {player: {name: player_name, id: player_id },
        game_id: game_id, players: players, role: role, roles:roles,
        game: {mission_player_count: mission_player_count, two_fails_needed: two_fails_needed, num_players: num_players, evil_players: evil_players}});
});
app.get('/mplay', function(req, res){
    show_play_page_mobile_bots(req,res);
});
function show_play_page_mobile_bots(req,res){
    var player_id = 'luke_id';
    var player_name = 'Luke';
    var game_id = game_logic.random_game_id() + '_bots';
    game_logic.start_game(game_id);
    game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

    //add 6 dummy players cus fuck it
    var bots_to_add = 9;
    var game = game_logic.game(game_id);
    for(var i = 0; i < bots_to_add; i++){
        var bot = game_logic.random_bot();
        var bot_name = bot.get_name();
        console.log("THE BOT IS " + bot_name);
        console.log(game.player_name_exists(bot_name));
        while(game.player_name_exists(bot_name)){
            bot = game_logic.random_bot();
            bot_name = bot.get_name();
            console.log(bot_name);
        }
        game_logic.add_new_player_to_game( game_id, {player: bot});
    }

    console.log(player_id + ' and ' + player_name + ' and ' + game_id);

    game.add_role('Merlin'); //add merlin
    game.add_role('Morgana'); //add merlin
    game.add_role('Mordred'); //add merlin
    game.add_role('Percival'); //add merlin
    game.start();
    game.add_to_buffer(player_id); //so it doesn't say you disconnected
    var players = game_logic.get_public_players_from_game(game_id);
    console.log(game.assigned_roles);
    var role = game.assigned_roles[player_id];
    var roles = game.assigned_roles;
    var num_players = game.get_number_of_players();
    var mission_player_count = game_logic.get_mission_player_count(num_players);
    var two_fails_needed = game_logic.needs_two_fails(num_players);
    var evil_players = game_logic.get_evil_players(num_players);
    res.render("game_mobile", {player: {name: player_name, id: player_id },
        game_id: game_id, players: players, role: role, roles:roles,
        game: {mission_player_count: mission_player_count, two_fails_needed: two_fails_needed, num_players: num_players, evil_players: evil_players}});
}
function show_join_page(req, res){
    if (!req.session.name) {
        res.redirect("/login");
    }else {
        var player_id = req.session.id;
        var player_name = req.session.name;
        var game_id = req.body.game_id;
        var game = game_logic.game(game_id);

        if (game.in_game(player_id)) {
            console.log('TO BUFFER');
            game.add_to_buffer(player_id);
        } else {
            console.log('ok join game');
            game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});
        }
        var players = game_logic.get_public_players_from_game(game_id);
        console.log('LOL');
        res.render("joingame", {
            player: {name: player_name, id: player_id},
            game_id: game_id,
            players: players,
            game_settings: game.get_settings()
        });
    }
}
function show_join_page_mobile(req, res){
    if (!req.session.name) {
        res.redirect("/login");
    }else {
        var player_id = req.session.id;
        var player_name = req.session.name;
        var game_id = req.body.game_id;
        var game = game_logic.game(game_id);

        if (game.in_game(player_id)) {
            console.log('TO BUFFER');
            game.add_to_buffer(player_id);
        } else {
            console.log('ok join game');
            game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});
        }
        var players = game_logic.get_public_players_from_game(game_id);
        console.log('LOL');
        res.render("joingame_mobile", {
            player: {name: player_name, id: player_id},
            game_id: game_id,
            players: players,
            game_settings: game.get_settings()
        });
    }
}
app.post('/join', function(req, res){
    show_join_page(req,res);
});
app.get('/rows', function(req, res){
    res.render("row");
});
app.post('/m/join', function(req, res){
    show_join_page_mobile(req,res);
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
        var open_games = game_logic.get_open_games();
        for(var i = 0; i < open_games.length; i++){
            var data = open_games[i];
            var game_id = data['game_id'];
            data['players'] = game_logic.get_players_from_game(game_id);
            console.log(data);
            socket.emit('new_game_started_lobby', data);
        }
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
        console.log('datar');
        console.log('game id is ' + data['game_id']);
        var game_id = data['game_id'];
        data['players'] = game_logic.get_players_from_game(game_id);
        io.of('/avalon').to('lobby').emit('new_game_started_lobby', data);
    });

    socket.on('disconnect', function() {
        var reconnect_time = 5000; //5 seconds
        setTimeout(function(){
            for(var i = 0; i < socket_rooms.length; i++){
                var game_id = socket_rooms[i];
                var game = game_logic.game(socket_rooms[i]);
                if(game.in_buffer(player_id)){//then you refreshed
                    console.log('fucker refreshed');
                }else{//you left
                    console.log('fucker left !! ' + player_id);
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

    socket.on('selected_player', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        console.log(data);
        console.log("SELECTED");
        if(game.get_leader() == player_id){
            var selected_id = data['selected_id'];
            console.log('leader selected ' + selected_id);
            game.player_selected(selected_id);
            console.log('game id is ' + game_id);
            socket.broadcast.to(game_id).emit('selected_player', selected_id);
        }
    });

    socket.on('deselected_player', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        if(game.get_leader() == player_id){
            var selected_id = data['selected_id'];
            console.log('leader deselected ' + selected_id);
            game.player_deselected(selected_id);
            socket.broadcast.to(game_id).emit('deselected_player', selected_id);
        }
    });

    socket.on('game_started', function(data){
        var game_id = data['game_id'];
        var player_id = data['player']['id'];
        socket.join(game_player_room(game_id, player_id));
        console.log('player ' + player_id + " joined room " + game_player_room(game_id, player_id));
        socket.join(game_id);
        console.log('teh gameid is ' + game_id);
        var game = game_logic.game(game_id);
        console.log('leader is ' + game.get_leader());
        socket.emit('new_leader', {leader_id: game.get_leader(), leader_name: game.get_leader_name()}); //NOT io.emit because people are getting rerouted and the rerouting fires this event
        //so if it were io.emit, it would fire multiple times for the first guy to load (his fires, and everyone who loads after him fires)
        var game_data = game.get_current_round();
        if(game.has_roles()){
            var player_role = game.get_player_role(player_id);
            var role_information = game.get_role_information(player_role);
            console.log("THE ROLE IS ");
            console.log(player_role);
            console.log("THE INFO IS ");
            console.log(role_information);
            socket.emit('are_you_ready_for_role');
        }else {
            var upcoming_leaders = game_logic.get_next_five_leaders(game_id);
            socket.emit('game_round_vote_count', {mission: game_data['round'], vote: game_data['vote'], leaders: upcoming_leaders});
            io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);
        }
    });

    socket.on('ready_for_role', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        var player_role = game.get_player_role(player_id);
        var role_information = game.get_role_information(player_role);
        console.log("THE ROLE IS ");
        console.log(player_role);
        console.log("THE INFO IS ");
        console.log(role_information);
        socket.emit('show_player_roles', {role: player_role, role_information: role_information});
    });

    socket.on('reshow_my_role', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        var player_role = game.get_player_role(player_id);
        var role_information = game.get_role_information(player_role);
        console.log("THE ROLE IS ");
        console.log(player_role);
        console.log("THE INFO IS ");
        console.log(role_information);
        socket.emit('reshow_player_roles', {role: player_role, role_information: role_information});
    });

    socket.on('done_with_role_info', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        game_logic.make_player_waiting_for(game_id, player_id, 'start');


        if(game_logic.all_players_waiting_for(game_id, 'start')){
            console.log('teh gameid is ' + game_id);
            console.log('leader is ' + game.get_leader());
            io.of('/avalon').to(game_id).emit('game_started'); //game start - enable buttons
            io.of('/avalon').to(game_id).emit('new_leader', {leader_id: game.get_leader(), leader_name: game.get_leader_name()}); //this here is io.emit since it fires only once
            var game_data = game.get_current_round();
            var upcoming_leaders = game_logic.get_next_five_leaders(game_id);
            io.of('/avalon').to(game_id).emit('game_round_vote_count', {mission: game_data['round'], vote: game_data['vote'], leaders: upcoming_leaders});
            io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);
            game_logic.clear_players_waiting_for(game_id, 'start');
        } else{
            socket.emit('waiting_for_everyone');
        }

    });

    socket.on('team_proposed', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        if(game.get_leader() == player_id && game.is_propose_state()){
            var game_players = game.get_player_ids();
            var selected_players = data['selected_players'];
            var public_players = game.get_public_players();
            var selected_player_names = game.get_selected_players_names();
            var leader = game.get_leader_name();
            console.log('selected players are ');
            console.log(selected_players);
            if(game.current_vote == 5){ //CHANGE THIS TO 5
                game.on_mission();
                vote_passed(game_id);
            }else {
                io.of('/avalon').to(game_id).emit('team_proposed', {
                    leader: leader,
                    selected_player_names: selected_player_names
                });
            }
        }
    });

    function vote_passed(game_id) {
        console.log("VOTE PAS");
        var game = game_logic.game(game_id);
        console.log("VOTE PSD????");
        if (game.is_mission_state()) {//should be in mission state already, fires only once
            console.log("ON MISSION STATE FINALLY");
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!! VOTE PASSED");
            var selected_players_ids = game.get_selected_players_ids();
            var selected_player_names = game.get_selected_players_names();
            var leader = game.get_leader_name();
            var game_players = game.get_player_ids();
            console.log('selected players are ');
            console.log(selected_players_ids);
            for (var i = 0; i < game_players.length; i++) {
                if (game.player_is_on_mission(game_players[i])) {
                    console.log('im on! autog ' + game_players[i]);
                    var is_spy = game.is_spy(game_players[i]);
                    console.log(is_spy);
                    io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('you_are_on_team', {
                        is_spy: is_spy,
                        selected_player_names: selected_player_names,
                        leader: leader
                    });
                } else {
                    console.log('apparently im not on ' + game_players[i]);
                    //waiting on voting?
                    io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('waiting_for_team', {
                        leader: leader,
                        selected_player_names: selected_player_names
                    });
                }
            }
            if (game_players[i] == 'luke_id' || game.no_humans_on_team()) { //this fires once.
                console.log("BOTS GO");
                bots_vote(game, game_id);
            }
        }
    }



    function vote_failed(game_id, player_id){
        //fires for each socket
        var game = game_logic.game(game_id);

        if(game.is_propose_state()) {
            game.vote_failed(); //automatically passes leadership
            console.log("MISSION FAILED SO RESET THESE BITCHES");
            console.log('new leader is ' + game.get_leader());
            io.of('/avalon').to(game_id).emit('new_leader', {leader_id: game.get_leader(), leader_name: game.get_leader_name()}); //this only fires once
            var game_data = game.get_current_round();
            io.of('/avalon').to(game_id).emit('game_round_vote_count', {
                mission: game_data['round'],
                vote: game_data['vote']
            });
            io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);

            if(player_id == 'luke_id'|| game.leader_is_bot()) {
                if (is_bot(game.get_leader()) && game.leader_is_bot()) {
                    random_bot_leader(game, game_id);
                }
            }

        }
    }

    function mission_passed(game_id){
        var game = game_logic.game(game_id);
        if(game.is_mission_state()) {
            game.mission_passed(); //automatically passes leadership
        }
    }

    function mission_failed(game_id){
        var game = game_logic.game(game_id);
        if(game.is_mission_state()) {
            game.mission_failed(); //automatically passes leadership
        }
    }
    socket.on('voted', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        if(!game.player_voted(player_id)){
            var vote = data['vote'];
            game.player_votes(player_id, vote);
            console.log('player ' + player_id + ' voted ' + vote);
            game_logic.make_player_waiting_for(game_id, player_id, 'to_vote');
            //make everyone vote yes for testing
            if(player_id == 'luke_id' || game.all_human_players_voted()){
                var bots = every_bot(game_id);
                console.log('making dumbass bots vote yes');
                for(var i = 0; i < bots.length; i++){
                    var bot = game.get_player_from_id(bots[i]);
                    if(game_logic.player_is_random(bot)){
                        game.player_votes(bots[i], game_logic.random_vote());
                    }

                }
            }

            if(game_logic.all_players_waiting_for(game_id, 'to_vote') && game.is_propose_state()){ //the bracket will only fire once - on the last guy to vote
                game_logic.clear_players_waiting_for(game_id, 'to_vote');
                var proposal_approved = game.proposal_approved();
                var vote_result = game.get_votes();
                var current_round = game.get_current_round();
                var mission_number = current_round['round'];
                var vote_number = current_round['vote'];
                console.log("EVERYONE VOTED");
                console.log(vote_result);
                //this fires once
                //when everyone is done viewing the vote results the players go on the mission
                //game AUTOMATICALLY PROCEEDS to mission state if vote passed
                //cus this only fires ONCE
                var next_player_name;
                var proposal_approved = game.proposal_approved();
                if(proposal_approved){
                    //game.on_mission(); //lock it when everyoine is done
                    var next_player_name = game.get_next_player_name();
                    var leader_name = game.get_leader_name(); //because i made the game already do it this is the current leader lolz
                                                                   //this is actually useless because it never gets read
                }else{
                    var leader_name = game.get_leader_name();
                    var next_player_name = game.get_next_player_name(); //because if it didn't get approved, the leadership didn't pass
                }
                var players = game.get_public_players();
                var proposed_team = game.get_selected_players_ids();
                console.log('proposed_team was ' + proposed_team);
                var data = {proposal_approved: proposal_approved, vote_results: vote_result, players: players, proposed_team: proposed_team, next_player_name: next_player_name, mission_number: mission_number, vote_number: vote_number, leader_name: leader_name};
                game_logic.set_last_vote(game_id, data);
                io.of('/avalon').to(game_id).emit('vote_result', data);
            }
        }
    });

    socket.on('submitted_mission', function(data){
        console.log("SOMEONE SUBMITTED");
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        console.log(game.player_is_on_mission(player_id));
        console.log("THAT WAS IF HE WAS ON MISSION AND THIS IS IF HE DIDNT SUBMIT");
        console.log(!game.player_submitted(player_id));
        if(game.player_is_on_mission(player_id) && !game.player_submitted(player_id)){
            var submission = data['submission'];
            if(!game.is_spy(player_id)){
                submission = "Success"; //no fucking around, makes you pass if you're not a spy
            }
            game.player_submits_mission(player_id, submission);
            console.log('player ' + player_id + ' submitted ' + submission);

            //make spies always fail for testing
            if(player_id == 'luke_id' || game.all_human_players_submitted()){
                console.log('all humans submitted wtf');
                var bots = every_bot(game_id);
                for(var i = 0; i < bots.length; i++){
                    var bot_id = bots[i];
                    if(game.player_is_on_mission(bot_id)){
                        if(game.is_spy(bot_id)){
                            game.player_submits_mission(bot_id, "Success");
                            //game.player_submits_mission(bot_id, "Success");
                        }else{
                            game.player_submits_mission(bot_id, "Success");
                        }
                    }
                }
            }
            if(game.all_players_submitted() && game.is_mission_state()){ //the bracket will only fire once - on the last guy to vote
                var mission_success = game.is_mission_success();
                var mission_result = game.get_mission_cards_shuffled();
                if(mission_success){
                    mission_passed(game_id);
                }else{
                    mission_failed(game_id);
                }
                console.log("EVERYONE SUBMITTED");
                console.log(mission_result);
                console.log(game.mission_result);
                var players = game.get_public_players();
                var team_members = game.get_selected_players_names();
                var next_player_name = game.get_next_player_name();
                var leader = game.get_leader_name();
                var game_data = game.get_current_round();
                var mission_round = game_data['round'];
                var data = {mission_round: mission_round, mission_success: mission_success, mission_result: mission_result, players: players, team_members: team_members, leader: leader, next_player_name: next_player_name};
                game_logic.set_last_mission(game_id, data);
                io.of('/avalon').to(game_id).emit('mission_result', data);
                game.next_mission();
            }
        }
    });


    socket.on('done_with_voting_results', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        console.log(player_id + ' is DONE WITH THIS SHIT');
        var game = game_logic.game(game_id);
        game_logic.make_player_waiting_for(game_id, player_id, 'everyone_to_be_done_with_voting_results');
        if(game_logic.all_players_waiting_for(game_id, 'everyone_to_be_done_with_voting_results')){ //so this fires only once
            game_logic.clear_players_waiting_for(game_id, 'everyone_to_be_done_with_voting_results');
            var proposal_approved = game.proposal_approved();
            if (proposal_approved && game.is_propose_state()) { //cus it didn't change states yet state
                game.on_mission(); //makes it mission state
                vote_passed(game_id);
            } else if (game.is_propose_state()) { //cus it stayed in propose state
                vote_failed(game_id, player_id);
            }

        }

    });

    socket.on('assassinate', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var selected_player = data['selected_player'];
        console.log(player_id + ' ASSASSINATES');
        var game = game_logic.game(game_id);

        if(game.missions_over()){ //server side validation that you can only assassinate if game is over, there is merlin and you are assassin
            var blue_wins = game.did_blue_win(); //true if blue wins
            var players = game.get_public_players();
            console.log('next1');
            if(game.has_merlin() && blue_wins){
                console.log('next2');
                if(game.player_is(player_id, game_logic.get_constants()['assassin'])){
                    console.log('next3');
                    var selected_player_is_merlin = game.player_is(selected_player, game_logic.get_constants()['merlin']);
                    var selected_player_role = game.get_player_role(selected_player);
                    //fires to each socket
                    io.of('/avalon').to(game_id).emit('assassination_result', {success: selected_player_is_merlin, selected_player: selected_player, role: selected_player_role});
                    var game_players = game.get_player_ids();
                    for (var i = 0; i < game_players.length; i++) { //tells not selected players to reveal roles
                        if (game_players[i] != selected_player) {
                            io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('show_reveal_role_to_all_button');
                        }
                    }
                }
            }
        }
    });

    socket.on('selected_player_to_assassinate', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var selected_player = data['selected_id'];
        console.log(player_id + ' ASSASSINATES');
        var game = game_logic.game(game_id);

        if(game.missions_over()){ //server side validation that you can only assassinate if game is over, there is merlin and you are assassin
            var blue_wins = game.did_blue_win(); //true if blue wins
            var players = game.get_public_players();
            console.log('next1');
            if(game.has_merlin() && blue_wins){
                console.log('next2');
                if(game.player_is(player_id, game_logic.get_constants()['assassin'])){
                    console.log('selected a nooblet ' + selected_player);
                    socket.broadcast.to(game_id).emit('selected_player_to_assassinate', selected_player);
                } else if(player_id == 'luke_id'){

                }
            }
        }
    });

    socket.on('deselected_player_to_assassinate', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var selected_player = data['selected_id'];
        console.log(player_id + ' ASSASSINATES');
        var game = game_logic.game(game_id);

        if(game.missions_over()){ //server side validation that you can only assassinate if game is over, there is merlin and you are assassin
            var blue_wins = game.did_blue_win(); //true if blue wins
            var players = game.get_public_players();
            console.log('next1');
            if(game.has_merlin() && blue_wins){
                console.log('next2');
                if(game.player_is(player_id, game_logic.get_constants()['assassin'])){
                    socket.broadcast.to(game_id).emit('deselected_player_to_assassinate', selected_player);
                }
            }
        }
    });
    socket.on('show_last_vote', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        console.log(player_id + ' wants last vote');
        var last_vote = game_logic.get_last_vote(game_id);
        socket.emit('showing_last_vote', last_vote);
    });
    socket.on('show_last_mission', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        console.log(player_id + ' wants last mission');
        var last_mission = game_logic.get_last_mission(game_id);
        socket.emit('showing_last_mission', last_mission);
    });
    socket.on('reveal_my_role_to_all', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        console.log(player_id + ' shows role');
        var game = game_logic.game(game_id);

        if(game.missions_over()) { //i guess you can make this fire many times ??
            var role = game.get_player_role(player_id);
            //fires to each socket
            io.of('/avalon').to(game_id).emit('player_reveals_role', {
                player_id: player_id,
                role: role
            });
        }
    });

    //in progress
    socket.on('done_with_mission_results', function(data){
        //fires for each socket but only proceed if the last guy is done
        var game_id = data['game_id'];
        var game = game_logic.game(game_id);
        var player_id = data['player_id'];
        if(game.is_propose_state()){ //cus we already progressed
            console.log("MISSION DONE LOOKING SO RESET THESE BITCHES");
            game_logic.make_player_waiting_for(game_id, player_id, 'everyone_done_with_mission_results');
            if(game_logic.all_players_waiting_for(game_id, 'everyone_done_with_mission_results')) {
                game_logic.clear_players_waiting_for(game_id, 'everyone_done_with_mission_results');
                if (game.missions_over()) {
                    //todo
                    game.end_game();
                    var did_blue_win = game.did_blue_win(); //true if blue wins
                    var players = game.get_public_players();
                    var game_players = game.get_player_ids();
                    if (game.has_merlin() && did_blue_win) {
                        for (var i = 0; i < game_players.length; i++) {
                            if (game_logic.player_id_is_role(game_id, game_players[i], 'assassin')) {
                                console.log('im assassin ' + game_players[i]);
                                io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('game_over_avalon_assassin', {
                                    game_id: game_id,
                                    player_id: player_id,
                                    players: players
                                });
                            } else {
                                console.log('not an assassin so i wait ' + game_players[i]);
                                //waiting on voting?
                                io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('game_over_avalon', {game_id: game_id, player_id: player_id, players: players});
                                if(!game.player_id_is_bot(game_players[i])){
                                    console.log(game_players[i] + ' now wiats');
                                    game_logic.make_player_waiting_for(game_id, game_players[i], 'assassination');
                                }
                                if (game_logic.assassin_is_bot(game_id) && game_logic.bot_assassin_has_not_assassinated_yet(game_id) && game_logic.all_players_waiting_for(game_id, 'assassination')) { //so this fires only once
                                    var random_assassin_target_player_id = game_logic.get_random_player_id(game_id);
                                    while (game_logic.player_is_evil_by_id(game_id, random_assassin_target_player_id)) {
                                        random_assassin_target_player_id = game_logic.get_random_player_id(game_id);
                                    }
                                    var selected_player = random_assassin_target_player_id;
                                    console.log(selected_player + ' ASSASSINATED BY BOT');
                                    io.of('/avalon').to(game_id).emit('selected_player_to_assassinate', selected_player);
                                    game_logic.set_bot_assassin_to_assassinate(game_id);
                                    var assassination_delay = 500;
                                    setTimeout(function () {
                                        console.log('now we show assassination result');
                                        var selected_player_is_merlin = game.player_is(selected_player, game_logic.get_constants()['merlin']);
                                        var selected_player_role = game.get_player_role(selected_player);
                                        //fires to each socket
                                        io.of('/avalon').to(game_id).emit('assassination_result', {
                                            success: selected_player_is_merlin,
                                            selected_player: selected_player,
                                            role: selected_player_role
                                        });
                                        var game_players = game.get_player_ids();
                                        for (var i = 0; i < game_players.length; i++) { //tells not selected players to reveal roles
                                            if (game_players[i] != selected_player) {
                                                io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('show_reveal_role_to_all_button');
                                            }
                                        }
                                        game_logic.clear_players_waiting_for(game_id, 'assassination');
                                        game_logic.clear_bot_assassin_flag(game_id);
                                    }, assassination_delay);
                                }
                            }
                        }
                    } else {
                        io.of('/avalon').to(game_id).emit('game_over', {result: did_blue_win, players: players});
                        io.of('/avalon').to(game_id).emit('show_reveal_role_to_all_button');
                    }


                    console.log("GAME OVER");
                } else {
                    io.of('/avalon').to(game_id).emit('new_leader', {leader_id: game.get_leader(), leader_name: game.get_leader_name()});
                    var game_data = game.get_current_round();
                    var upcoming_leaders = game_logic.get_next_five_leaders(game_id);
                    io.of('/avalon').to(game_id).emit('game_round_vote_count', {mission: game_data['round'], vote: game_data['vote'], leaders: upcoming_leaders});
                    io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);

                    //for bots
                    if (player_id == 'luke_id' || game.leader_is_bot()) { //because i coded this poorly the first time not allowing multiple humans and bots
                        //oops this fires for each socket lets make it fire only once...
                        if (is_bot(game.get_leader()) && game.leader_is_bot()) {
                            console.log("EVERYOEN FUCKING DONE WITH RESULTS FUCKING BOTS?!?!?!");
                            random_bot_leader(game, game_id);
                        }
                    }
                }
            }
        }
    });

    function bots_vote(game, game_id){
        var proposed_team = game.get_selected_players_ids();
        for(var i = 0; i < proposed_team.length; i++){
            var player_id = proposed_team[i];
            console.log("BOT SUBMITTED");
            console.log(game.player_is_on_mission(player_id));
            console.log("THAT WAS IF HE WAS ON MISSION AND THIS IS IF HE DIDNT SUBMIT");
            console.log(!game.player_submitted(player_id));
            if(game.player_is_on_mission(player_id) && !game.player_submitted(player_id)){
                var submission = "Success";  //bots fail
                //var submission = "Success";  //bots fail
                if(!game.is_spy(player_id)){
                    submission = "Success"; //no fucking around, makes you pass if you're not a spy
                }
                game.player_submits_mission(player_id, submission);
                console.log('player ' + player_id + ' submitted ' + submission);

                if(game.all_players_submitted() && game.is_mission_state()){ //the bracket will only fire once - on the last guy to vote
                    var mission_success = game.is_mission_success();
                    var mission_result = game.get_mission_cards_shuffled();
                    if(mission_success){
                        mission_passed(game_id);
                    }else{
                        mission_failed(game_id);
                    }
                    console.log("EVERYONE SUBMITTED");
                    console.log(mission_result);
                    console.log(game.mission_result);
                    var players = game.get_public_players();
                    var team_members = game.get_selected_players_names();
                    var next_player_name = game.get_next_player_name();
                    var leader = game.get_leader_name();
                    var game_data = game.get_current_round();
                    var mission_round = game_data['round'];
                    var data = {mission_round: mission_round, mission_success: mission_success, mission_result: mission_result, players: players, team_members: team_members, leader: leader, next_player_name: next_player_name};
                    game_logic.set_last_mission(game_id, data);
                    io.of('/avalon').to(game_id).emit('mission_result', data);
                    game.next_mission();
                }
            }
        }

    }
    function random_bot_leader(game, game_id){
            var bot_leader = game.get_player_from_id(game.get_leader());
            if(game_logic.player_is_random(bot_leader)){
                var randomly_selected_players = game_logic.select_random_players(game);
                for(var i = 0; i < randomly_selected_players.length; i++){
                    var selected_id = randomly_selected_players[i];
                    game.player_selected(selected_id);
                    io.of('/avalon').to(game_id).emit('selected_player', selected_id);
                }
            }

            var selected_players = randomly_selected_players;
            var selected_player_names = game.get_selected_players_names();
            var leader = game.get_leader_name();
            console.log('selected players are ');
            console.log(selected_players);
            if(game.current_vote == 5){ //CHANGE THIS TO 5
                game.on_mission();
                vote_passed(game_id);
            }else {
                io.of('/avalon').to(game_id).emit('team_proposed', {
                    leader: leader,
                    selected_player_names: selected_player_names
                });
            }
    }
    function is_bot(player_id){
        var luke = 'luke_id';
        return player_id != luke;
    }
    function every_bot(game_id){
        var game = game_logic.game(game_id);
        var player_ids = game.get_non_human_player_ids();
        var bot_ids = [];
        var luke = 'luke_id';
        for(var i = 0; i < player_ids.length; i++){
            if(player_ids[i] != luke){
                bot_ids.push(player_ids[i]);
            }
        }
        return bot_ids;
    }

    function leader_room(game_id){
        var game = game_logic.game(game_id);
        var leader_id = game.get_leader();
        return game_player_room(game_id, leader_id);
    }
    function game_player_room(game_id, player_id){
        return 'avalon_game' + game_id + '_player_' + player_id;
    }


});

console.log("Listening on port " + port);