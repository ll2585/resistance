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
    game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

    //add 4 dummy players cus fuck it


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
    var num_players = game.get_number_of_players();
    var mission_player_count = game_logic.get_mission_player_count(num_players);
    var two_fails_needed = game_logic.needs_two_fails(num_players);
    var evil_players = game_logic.get_evil_players(num_players);
    res.render("game", {player: {name: player_name, id: player_id },
        game_id: game_id, players: players, role: role, roles:roles,
        game: {mission_player_count: mission_player_count, two_fails_needed: two_fails_needed, num_players: num_players, evil_players: evil_players}});
});

app.get('/play', function(req, res){
    var player_id = 'luke_id';
    var player_name = 'Luke';
    var game_id = 1;
    game_logic.start_game(game_id);
    game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});

    //add 4 dummy players cus fuck it
    var bots_to_add = 4;
    for(var i = 0; i < bots_to_add; i++){
        game_logic.add_new_player_to_game( game_id, {player: game_logic.random_bot()});
    }
    console.log(player_id + ' and ' + player_name + ' and ' + game_id);
    var game = game_logic.game(game_id);
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
        game_logic.add_new_player_to_game(game_id, {id: player_id, name: player_name});
    }
    var players = game_logic.get_public_players_from_game(game_id);
    console.log('LOL');
    res.render("joingame", {player: {name: player_name, id: player_id }, game_id: 1, players: players, game_settings: game.get_settings()});
});

var avalon_players_done_with_voting_results = {}; //fuck this shitty work around around the timing issue when some ppl finish the timeout function (countdown)
//and then emit a signal that causes the others to display somethinge lse, but then they finish the timeout after
var avalon_players_done_with_mission_results = {}; //same bullshit
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
        var game = game_logic.game(game_id);
        console.log('leader is ' + game.get_leader());
        socket.emit('new_leader', game.get_leader()); //NOT io.emit because people are getting rerouted and the rerouting fires this event
        //so if it were io.emit, it would fire multiple times for the first guy to load (his fires, and everyone who loads after him fires)
        var game_data = game.get_current_round();
        socket.emit('game_round_vote_count', {mission: game_data['round'], vote: game_data['vote']});
        io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);
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
                vote_passed(game_id, true);
            }else {
                io.of('/avalon').to(game_id).emit('team_proposed', {
                    leader: leader,
                    selected_player_names: selected_player_names
                });
            }
        }
    });
    /**
    socket.on('vote_passed', function(data){
        var game_id = data['game_id'];
        var player_id = data['player_id'];
        var game = game_logic.game(game_id);
        if(game.get_leader() == player_id && game.is_propose_state()){
            game.team_proposed();
            var game_players = game.get_player_ids();
            var selected_players = data['selected_players'];
            var public_players = game.get_public_players();
            var selected_player_names = [];
            console.log('selected players are ');
            console.log(selected_players);
            for(var i = 0; i < public_players.length; i++){
                if(selected_players.indexOf(public_players[i]['id']) > -1){
                    selected_player_names.push(public_players[i]['name']);
                }
            }
            for(var i = 0 ; i < game_players.length; i++){
                if(selected_players.indexOf(game_players[i]) > -1){
                    var is_spy = game.is_spy(game_players[i]);
                    console.log(is_spy);
                    io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('you_are_on_team', {is_spy: is_spy, selected_player_names: selected_player_names});
                } else{
                    io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('team_proposed', {selected_player_names: selected_player_names});
                }
            }
        }
    });
    **/
    function vote_passed(game_id, auto_go){
        console.log("VOTE PAS")
        var game = game_logic.game(game_id);
        console.log("VOTE PSD????");
        if(game.is_propose_state()) {
            if(auto_go || avalon_players_done_with_voting_results[game_id].length == game.get_number_of_players()) {
                console.log("ON MISSION STATE FINALLY");
                game.on_mission(); //lock it when everyoine is done
                avalon_players_done_with_voting_results[game_id] = [];
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!! VOTE PASSED");
                var selected_players_ids = game.get_selected_players_ids();
                var selected_player_names = game.get_selected_players_names();
                var game_players = game.get_player_ids();
                var leader = game.get_leader_name();
                console.log('selected players are ');
                console.log(selected_players_ids);
                for (var i = 0; i < game_players.length; i++) {
                    if (game.player_is_on_mission(game_players[i])) {
                        console.log('im on! ' + game_players[i]);
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
                        io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('waiting_for_team', {leader: leader, selected_player_names: selected_player_names});
                    }
                }
            }
        }
    }



    function vote_failed(game_id){
        var game = game_logic.game(game_id);
        if(game.is_propose_state()) {
            if (avalon_players_done_with_voting_results[game_id].length == game.get_number_of_players()) {
                console.log("MISSION FAILED SO RESET THESE BITCHES");
                avalon_players_done_with_voting_results[game_id] = [];

                game.vote_failed(); //automatically passes leadership
                console.log('new leader is ' + game.get_leader());
                io.of('/avalon').to(game_id).emit('new_leader', game.get_leader()); //NOT io.emit because people are getting rerouted and the rerouting fires this event
                //so if it were io.emit, it would fire multiple times for the first guy to load (his fires, and everyone who loads after him fires)
                var game_data = game.get_current_round();
                io.of('/avalon').to(game_id).emit('game_round_vote_count', {
                    mission: game_data['round'],
                    vote: game_data['vote']
                });
                io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);
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

            //make everyone vote yes for testing
            if(player_id == 'luke_id'){
                var bots = every_bot(game_id);
                for(var i = 0; i < bots.length; i++){
                    var bot = game.get_player_from_id(bots[i]);
                    if(game_logic.player_is_random(bot)){
                        game.player_votes(bots[i], game_logic.random_vote());
                    }

                }
            }

            if(game.all_players_voted() && game.is_propose_state()){ //the bracket will only fire once - on the last guy to vote
                var proposal_approved = game.proposal_approved();
                var vote_result = game.get_votes();
                console.log("EVERYONE VOTED");
                console.log(vote_result);
                var players = game.get_public_players();
                var proposed_team = game.get_selected_players_ids();
                var next_player_name = game.get_next_player_name();
                io.of('/avalon').to(game_id).emit('vote_result', {proposal_approved: proposal_approved, vote_results: vote_result, players: players, proposed_team: proposed_team, next_player_name: next_player_name});
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
            if(player_id == 1){
                var bots = every_bot(game_id);
                for(var i = 0; i < bots.length; i++){
                    var bot_id = bots[i];
                    if(game.player_is_on_mission(bot_id)){
                        if(game.is_spy(bot_id)){
                            game.player_submits_mission(bot_id, "Fail");
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
                io.of('/avalon').to(game_id).emit('mission_result', {mission_round: mission_round, mission_success: mission_success, mission_result: mission_result, players: players, team_members: team_members, leader: leader, next_player_name: next_player_name});
            }
        }
    });


    socket.on('done_with_voting_results', function(data){
        var game_id = data['game_id'];
        if(!(game_id in avalon_players_done_with_voting_results)){
            console.log("RESET THIS WORKAROUND");
            avalon_players_done_with_voting_results[game_id] = [];
        }
        var player_id = data['player_id'];
        console.log(player_id + ' is DONE WITH THIS SHIT');
        avalon_players_done_with_voting_results[game_id].push(player_id);
        console.log("DUMBASSES WHO ARE DONE ");
        console.log(avalon_players_done_with_voting_results);
        var game = game_logic.game(game_id);
        if(game.all_players_voted() && game.is_propose_state()){
            var proposal_approved = game.proposal_approved();
            if(proposal_approved){
                vote_passed(game_id, false);
            }else{
                vote_failed(game_id);
            }
        }
    });

    //in progress
    socket.on('done_with_mission_results', function(data){
        var game_id = data['game_id'];
        var game = game_logic.game(game_id);
        if(!(game_id in avalon_players_done_with_mission_results)){
            console.log("RESET THIS WORKAROUND");
            avalon_players_done_with_mission_results[game_id] = [];
        }
        avalon_players_done_with_mission_results[game_id].push(player_id);
        if(game.all_players_submitted() && game.is_mission_state() && avalon_players_done_with_mission_results[game_id].length == game.get_number_of_players()){
            console.log("MISSION DONE LOOKING SO RESET THESE BITCHES");
            avalon_players_done_with_mission_results[game_id] = [];
            if(game.missions_over()){
                //todo
            }else{
                game.next_mission();
                io.of('/avalon').to(game_id).emit('new_leader', game.get_leader()); //because of that bullshit workaround, can just fire to all since it only fires once
                var game_data = game.get_current_round();
                io.of('/avalon').to(game_id).emit('game_round_vote_count', {mission: game_data['round'], vote: game_data['vote']});
                io.of('/avalon').to(leader_room(game_id)).emit('you_are_leader', game_data);
            }
        }
    });
    /**delete if you see you don't need it
    socket.on('voted', function(data){
        var game_id = data['game_id'];
        var game = game_logic.game(game_id);
        if(game.all_players_voted() && game.is_propose_state()){
            var proposal_approved = game.proposal_approved();
            var players = game.get_public_players();
            if(proposal_approved){
                game.on_mission();
                var selected_players_ids = game.get_selected_players_ids();
                var public_players = game.get_public_players();
                var selected_player_names = [];
                var game_players = game.get_player_ids();
                console.log('selected players are ');
                console.log(selected_players_ids);
                for(var i = 0; i < public_players.length; i++){
                    if(selected_players_ids.indexOf(public_players[i]['id']) > -1){
                        selected_player_names.push(public_players[i]['name']);
                    }
                }
                for(var i = 0 ; i < game_players.length; i++){
                    if(selected_players_ids.indexOf(game_players[i]) > -1){
                        var is_spy = game.is_spy(game_players[i]);
                        console.log(is_spy);
                        io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('you_are_on_team', {is_spy: is_spy, selected_player_names: selected_player_names});
                    } else{
                        io.of('/avalon').to(game_player_room(game_id, game_players[i])).emit('proposal_passed', {selected_player_names: selected_player_names});
                    }
                }
            }else{
                io.of('/avalon').to(game_id).emit('proposal_failed', {vote_result: proposal_approved});
            }
        }
    });
    **/
    function every_bot(game_id){
        var game = game_logic.game(game_id);
        var player_ids = game.get_player_ids();
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