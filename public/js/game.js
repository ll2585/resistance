var socket = io('/avalon');
var leader_icon_html = '<img src = "images/leader.png" height = "20" width = "20">';
var selected_icon_html = '<img src = "images/selected.png" height = "20" width = "20">';
var assassination_icon_html = '<span id = "assassination_icon"><img src = "images/dagger.png" height = "20" width = "20"></span>';
var role_wait_time = 1;
var vote_wait_time = 1;
var mission_wait_time = 1;
function get_game_id (){
    var game_id_elem = $('#game_id');
    return game_id_elem.html();
}

function get_player_id (){
    return $('.playerID').attr('id');
}

function make_leader (leader_id){
    clear_old_leaders();
    reset_selected_players();
    var elem = $('#player_id_' + leader_id);
    var icon_elem = $('#leader_player_id_' + leader_id);
    elem.addClass('leader');
    icon_elem.append(leader_icon_html);
}

function clear_messages(){
    console.log("CLEARING FUCKING MESSAGES");
    $("#game_messages").empty();
}

function clear_old_leaders(){
    $(".leader").removeClass('leader');
    $(".leader_col").empty();

}

function reset_selected_players(){
    $(".mission_col").empty();
    $("#propose").remove();
}

function propose_team_prompt (team_size, players){
    var html = "propose a team of size " + team_size + " by clicking on their names <br />";
    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><caption>SCOREBOARD</caption><thead></thead><tr><th>Player</th><th>Selected?</th></tr><tbody class="players-to-select">';
    var players = players;
    var selected_players = [];
    for(var i = 0; i < players.length; i++){
        player_table_html += '<tr id="player_id_' + players[i]['id'] + '_to_select"><td>' + players[i]['name'] + '</td><td id="' + players[i]['id'] + '_selected_status">Not Selected</td></tr>';
    }
    player_table_html += '</tbody></table>';
    $('#game_messages').html(html + player_table_html);

    for(var i = 0; i < players.length; i++) {
        $('#player_id_' + players[i]['id'] + '_to_select').on("click", {
                player_id: players[i]['id']
            }, select_player
        );
    }

    function select_player(event){
        var player_id = event.data.player_id;
        if(!is_selected(player_id)) {
            if (total_selected_players() < team_size) {
                console.log('clicked ' + player_id);
                selected_players.push(player_id);
                $('#player_id_' + player_id + '_to_select').addClass("selected");
                $('#' + player_id + '_selected_status').html("Selected");
                $('#mission_player_id_' + player_id).append(selected_icon_html);
                socket.emit("selected_player", {game_id: get_game_id(), player_id: get_player_id(), selected_id: player_id});
                if(total_selected_players() == team_size){
                    show_propose_button();
                }
            }
        } else{
            var index = selected_players.indexOf(player_id);
            selected_players.splice(index, 1);
            $('#player_id_' + player_id + '_to_select').removeClass("selected");
            $('#' + player_id + '_selected_status').html("Not Selected");
            $('#mission_player_id_' + player_id).empty();
            socket.emit("deselected_player", {game_id: get_game_id(), player_id: get_player_id(), selected_id: player_id});
            if(total_selected_players() < team_size){
                remove_propose_button();
            }
        }
    }

    function is_selected(player_id){
        return $('#' + player_id + '_selected_status').html() == "Selected";
    }

    function show_propose_button(){
        var button = '<div id = "propose"><button type="button" id = "propose_button">Propose Team</button></div>';
        $("#game_messages").append(button);
        $('#propose').click(function(){
            socket.emit("team_proposed", {game_id: get_game_id(), player_id: get_player_id(), selected_players: selected_players});
        });
    }

    function remove_propose_button(){
        $("#propose").remove();
    }

    function total_selected_players(){
        return selected_players.length;
    }

}

function show_mission_cards(is_spy, selected_player_names, leader){
    clear_messages();
    console.log("WHERE TEH FUCKING CARDS?");
    var proposed_team = selected_player_names;
    var team_html = leader + " has proposed a team consisting of: <ul>";
    for(var i = 0; i < proposed_team.length; i++){
        team_html += '<li>' + proposed_team[i] + '</li>';
    }
    team_html += '</ul>';

    team_html += '<div class = "row"><div class = "col-md-2"><img src = "images/success_mission.png", id = "success_mission", width = 75, height = 98, class = "not_selected"></div>' +
    '<div class = "col-md-2"><img src = "images/fail_mission.png" id = "fail_mission", width = 75, height = 98, class = "not_selected"></div></div><br>';
    $("#game_messages").append(team_html);
    console.log(team_html);
    $('#success_mission').click(function(){
        if(!$('#success_mission').hasClass('submit_mission_selected')){
            remove_mission_button();
            $('#fail_mission').removeClass('submit_mission_selected');
            $('#success_mission').addClass('submit_mission_selected');
            $('#fail_mission').addClass('not_selected');
            $('#success_mission').removeClass('not_selected');
            show_mission_button('Success');
        } else{
            $('#success_mission').removeClass('submit_mission_selected');
            $('#success_mission').addClass('not_selected');
            remove_mission_button();
        }
    });
    $('#fail_mission').click(function(){
        if(is_spy) {
            if (!$('#fail_mission').hasClass('submit_mission_selected')) {
                remove_mission_button();
                $('#success_mission').removeClass('submit_mission_selected');
                $('#fail_mission').addClass('submit_mission_selected');
                $('#success_mission').addClass('not_selected');
                $('#fail_mission').removeClass('not_selected');
                show_mission_button('Fail');
            } else {
                $('#fail_mission').removeClass('submit_mission_selected');
                $('#fail_mission').addClass('not_selected');
                remove_mission_button();
            }
        }
    });

    function show_mission_button(submission){
        var button = '<div id = "submit_mission", class = "row"><button type="button" id = "submit_mission_button">Submit ' + submission + '</button></div>';
        $("#game_messages").append(button);
        $('#submit_mission_button').click(function(){
            socket.emit("submitted_mission", {game_id: get_game_id(), player_id: get_player_id(), submission: submission});
            remove_mission_button();
            disable_mission_buttions();
            $("#game_messages").append("Waiting for everyone to submit their mission cards...");
        });
    }
    function disable_mission_buttions(){
        $('#fail_mission').off();
        $('#success_mission').off();
    }
    function remove_mission_button(){
        $("#submit_mission").remove();
    }
}

function show_waiting_for_team_message(leader, proposed_team){
    clear_messages();
    var proposal_html = leader + " has proposed a team consisting of: <ul>";
    for(var i = 0; i < proposed_team.length; i++){
        proposal_html += '<li>' + proposed_team[i] + '</li>';
    }
    proposal_html += '</ul>';
    proposal_html += '<br>Waiting for the mission results...';
    $("#game_messages").append(proposal_html);
}

function show_waiting_for_players_to_check_roles_message(){
    clear_messages();
    var proposal_html = 'Waiting for the everyone to check their roles...';
    $("#game_messages").append(proposal_html);
}

function show_proposed_team(leader, proposed_team){
    clear_messages();
    console.log("PROPOSED TEAM SHOWN");
    var proposal_html = leader + " has proposed a team consisting of: <ul>";
    for(var i = 0; i < proposed_team.length; i++){
        proposal_html += '<li>' + proposed_team[i] + '</li>';
    }
    proposal_html += '</ul>';
    proposal_html += '<div class = "row"><div class = "col-md-2"><img src = "images/approve_team.png", id = "approve_team", width = 75, height = 98, class = "not_selected"></div>' +
    '<div class = "col-md-2"><img src = "images/reject_team.png" id = "fail_team", width = 75, height = 98, class = "not_selected"></div></div><br>';
    $("#game_messages").append(proposal_html);
    $('#approve_team').click(function(){
        if(!$('#approve_team').hasClass('vote_selected')){
            remove_vote_button();
            $('#fail_team').removeClass('vote_selected');
            $('#approve_team').addClass('vote_selected');
            $('#fail_team').addClass('not_selected');
            $('#approve_team').removeClass('not_selected');
            show_vote_button('Approve');
        } else{
            $('#approve_team').removeClass('vote_selected');
            $('#approve_team').addClass('not_selected');
            remove_vote_button();
        }
    });
    $('#fail_team').click(function(){
        if(!$('#fail_team').hasClass('vote_selected')){
            remove_vote_button();
            $('#approve_team').removeClass('vote_selected');
            $('#fail_team').addClass('vote_selected');
            $('#approve_team').addClass('not_selected');
            $('#fail_team').removeClass('not_selected');
            show_vote_button('Reject');
        } else{
            $('#fail_team').removeClass('vote_selected');
            $('#fail_team').addClass('not_selected');
            remove_vote_button();
        }
    });

    function show_vote_button(vote){
        var button = '<div id = "vote", class = "row"><button type="button" id = "vote_button">Vote ' + vote + '</button></div>';
        $("#game_messages").append(button);
        $('#vote_button').click(function(){
            socket.emit("voted", {game_id: get_game_id(), player_id: get_player_id(), vote: vote});
            remove_vote_button();
            disable_vote_buttions();
            $("#game_messages").append("Waiting for everyone to vote...");
        });
    }

    function remove_vote_button(){
        $("#vote").remove();
    }

    function disable_vote_buttions(){
        $('#fail_team').off();
        $('#approve_team').off();
    }
}

function show_countdown(seconds, callback){

    var seconds_remaining = seconds;
    var countdown_html = '<div id = "countdown">' + seconds_remaining + "</div>";
    $('#game_messages').append(countdown_html);
    var countdown = setInterval(
        update_countdown, 1000);
    function update_countdown(){
        seconds_remaining -= 1;
        var countdown_html = '<div id = "countdown">' + seconds_remaining + "</div>";
        $('#countdown').html(countdown_html);
        if(seconds_remaining <= 0){
            clearInterval(countdown);
        }
    }
    setTimeout(
        function()
        {
            clear_messages();
            console.log("CLEARED FROM TIMEOUT");
            callback();

        }, seconds*1000);
}
function done_with_voting_results(){
    socket.emit("done_with_voting_results", {game_id: get_game_id(), player_id: get_player_id()});
}
function show_vote_result(proposal_approved, vote_results, players, proposed_team, next_player_name){
    clear_messages();
    console.log("SHGOWING RESULT");
    show_countdown(vote_wait_time, done_with_voting_results);
    var html = "THE PROPOSAL ";
    if(proposal_approved){
        html += "PASSED";
    } else{
        html += "FAILED. LEADERSHIP WILL PASS TO " + next_player_name;
    }
    html += "<br>";

    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><caption>VOTING RESULTS</caption><thead></thead><tr><th>Player</th><th></th><th>VOTE</th></tr><tbody class="players-to-select">';
    for(var i = 0; i < players.length; i++){
        var player_id = players[i]['id'];
        var player_name = players[i]['name'];
        var in_team = proposed_team.indexOf(player_id) > -1;
        console.log(player_id + ' is in team? ' + in_team);
        console.log(proposed_team);
        var player_voted_yes = vote_results[player_name] == "Approve";
        var voting_class;
        if(player_voted_yes){
            voting_class = 'approved_vote';
        } else{
            voting_class = 'rejected_vote';
        }
        player_table_html += '<tr id="player_id_' + player_id + '_vote_result", class = ' + voting_class + '><td>' + player_name + '</td><td id="' + player_id + '_selected_status">';
        if(in_team){
            player_table_html += '<img src="images/selected.png" height="20" width="20">';
        }
        player_table_html += '</td><td>' + vote_results[player_name] + '</td></tr>';
    }
    player_table_html += '</tbody></table>';
    $('#game_messages').append(html + player_table_html);
}

function done_with_mission_results(){
    socket.emit("done_with_mission_results", {game_id: get_game_id(), player_id: get_player_id()});
}

function clear_vote_track(){
    for(var i = 1; i < 6; i++){
        $('#vote_' + i).removeClass('current_vote_' + i);
    }
}
function set_vote_track(vote){

    $('#vote_' + vote).addClass('current_vote_' + vote);
}
function set_mission_in_progress(mission){
    $('#mission_' + mission).addClass('current_mission');
}
function set_mission_result(mission, status){
    if(status){
        $('#mission_' + mission).addClass('mission_success');
    }else{
        $('#mission_' + mission).addClass('mission_failed');
    }

}
function update_mission_and_vote_counters(mission, vote){
    clear_vote_track();
    set_vote_track(vote);
    set_mission_in_progress(mission);
}
function show_mission_result(leader, team_members, mission_success, mission_result, game_round){
    clear_messages();
    console.log("MSG RESULT");
    show_countdown(mission_wait_time, done_with_mission_results);
    var html = "THE MISSION ";
    if(mission_success){
        html += "SUCCEED!";
    } else{
        html += "FAILED!";
    }
    html += "<br>";
    set_mission_result(game_round, mission_success);
    for(var i = 0; i < mission_result.length; i++){
        if(mission_result[i] == "Success"){
            html += '<img src="images/success_mission.png" height="98" width="75">';
        }else{
            html += '<img src="images/fail_mission.png" height="98" width="75">';
        }
    }
    var team_html = '<br>' + leader + " proposed a team consisting of: <ul>";
    for(var i = 0; i < team_members.length; i++){
        team_html += '<li>' + team_members[i] + '</li>';
    }
    team_html += '</ul>';
    $('#game_messages').append(html + team_html);
}

function done_with_role_info(){
    socket.emit("done_with_role_info", {game_id: get_game_id(), player_id: get_player_id()});
}
function show_role_info(role, info){
    clear_messages();
    console.log("SHGOWING ROLE");
    show_countdown(role_wait_time, done_with_role_info);
    var html = 'You are <b> ' + role + '</b><br>' + info['html'];
    $('#game_messages').append(html);
}
function show_show_role_button(){
    clear_messages();
    var button = '<div id = "role"><button type="button" id = "role_button">Show My Role!</button></div>';
    $("#game_messages").append(button);
    $('#role').click(function(){
        socket.emit("ready_for_role", {game_id: get_game_id(), player_id: get_player_id()});
    });
}

function show_assassination_panel (players, is_assassin){
    var html = "";
    if(is_assassin) {
        html = "SELECT WHO YOU THINK IS MERLIN BY CLICKING ON THEIR NAMES<br />";
    }else{
        html = "WAITING FOR ASSASSIN<br />";
    }
    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><thead></thead><tr><th>Player</th><th>Role</th></tr><tbody class="players-to-assassinate">';
    var players = players;
    console.log(players);
    var selected_player = null;
    for(var i = 0; i < players.length; i++){
        player_table_html += '<tr id="player_id_' + players[i]['id'] + '_to_assassinate"><td>' + players[i]['name'] + '</td><td id = "player_id_' + players[i]['id'] + '_role"></td></tr>';
    }
    player_table_html += '</tbody></table>';
    $('#game_messages').html(html + player_table_html);
    if(is_assassin) {
        for (var i = 0; i < players.length; i++) {
            var player_id = players[i]['id'];
            console.log(player_id);
            if (player_id != get_player_id()) { //since you can't assassinate yourself...
                $('#player_id_' + player_id + '_to_assassinate').on("click", {
                        player_id: player_id, player_name: players[i]['name']
                    }, select_player_to_assassinate
                );
                console.log('added clicker to ' + player_id);
            }
        }
    }

    function select_player_to_assassinate(event){
        var player_id = event.data.player_id;
        console.log('clicked ' + player_id + ' first!');
        var player_name = event.data.player_name;
        if(!is_selected_to_assassinate(player_id)) {
            if(selected_player !== null){
                //clear selected player
                clear_assassination_from(selected_player);
            }
            console.log('clicked ' + player_id);
            selected_player = player_id;
            player_selected_to_be_assassinated(player_id);

            socket.emit("selected_player_to_assassinate", {game_id: get_game_id(), player_id: get_player_id(), selected_id: player_id});
            show_assassinate_button(player_name);
        } else{
            console.log('ok we already selected him now unselect');
            clear_assassination_from(player_id);
        }
    }

    function clear_assassination_from(player_id){
        console.log('clearing from ' + player_id);
        player_deselected_to_be_assassinated(player_id);
        selected_player = null;
        socket.emit("deselected_player_to_assassinate", {game_id: get_game_id(), player_id: get_player_id(), selected_id: player_id});
        remove_assassinate_button();
    }

    function is_selected_to_assassinate(player_id){
        return selected_player == player_id;
    }

    function show_assassinate_button(player_name){
        var button = '<div id = "assassinate"><button type="button" id = "assassinate_button">Assassinate ' + player_name + '</button></div>';
        $("#game_messages").append(button);
        $('#assassinate').click(function(){
            console.log('assassinated!!!');
            unbind_clicks();
            remove_assassinate_button();
            socket.emit("assassinate", {game_id: get_game_id(), player_id: get_player_id(), selected_player: selected_player});
        });
    }

    function unbind_clicks(){
        for(var i = 0; i < players.length; i++) {
            var player_id = players[i]['id'];
            console.log(player_id);
            if(player_id != get_player_id()){ //since you can't assassinate yourself...
                $('#player_id_' + player_id + '_to_assassinate').off("click");
                console.log('removed clicker from ' + player_id);
            }
        }
    }

    function remove_assassinate_button(){
        $("#assassinate").remove();
    }

}

function player_selected_to_be_assassinated(player_id){
    console.log('THIS GUY IS CHOSEN TO DIE');
    $('#player_id_' + player_id + '_to_assassinate').addClass("selected");
    $('#player_id_' + player_id + '_to_assassinate').children('td:nth-child(1)').append(assassination_icon_html);
}

function player_deselected_to_be_assassinated(player_id){
    $('#player_id_' + player_id + '_to_assassinate').removeClass("selected");
    $('#assassination_icon').remove();
}

function show_reveal_role_to_all_button(){
    var button = '<div id = "reveal_role"><button type="button" id = "reveal_role_button">Show my role!</button></div>';
    console.log('wat');
    $('#player_id_' + get_player_id() + '_role').append(button);
    $('#reveal_role').click(function(){
        console.log('shown role');
        $("#reveal_role").remove();
        socket.emit("reveal_my_role_to_all", {game_id: get_game_id(), player_id: get_player_id()});
    });
}

function reveal_assassinated_player_role(success, selected_player, role){
    if(success){
        $('#player_id_' + selected_player + '_to_assassinate').addClass("successful_assassination");
        red_wins();
    } else{
        $('#player_id_' + selected_player + '_to_assassinate').addClass("failed_assassination");
        blue_wins();
    }
    show_player_role(selected_player, role);

}

function show_player_role(player_id, role){
    $('#player_id_' + player_id + '_role').append(role);
}
function red_wins(){
    var winning_team = "RED";
    $('#game_messages').append(winning_team + " WINS!");
    $(body).css("background-color","#FF6961");
}

function blue_wins(){
    var winning_team = "BLUE";
    $('#game_messages').append(winning_team + " WINS!");
    $(body).css("background-color","#B3DDEB");
}

$(document).ready(function() {
    var player_id = $('.playerID').attr('id');
    var player_name = $('.playerID').html();
    socket.emit("game_started", {game_id: get_game_id(), player: {id: player_id, name: player_name}});



    socket.on("new_leader", function(leader_id){
        console.log(leader_id);
        make_leader(leader_id);
    });

    socket.on("show_player_roles", function(data){
        var my_role = data['role'];
        var info = data['role_information'];
        show_role_info(my_role, info);
    });

    socket.on("are_you_ready_for_role", function(){
        show_show_role_button();
    });

    socket.on("waiting_for_everyone", function(){
        show_waiting_for_players_to_check_roles_message();
    });


    socket.on("game_round_vote_count", function(data){
        var mission = data['mission'];
        var vote = data['vote'];
        update_mission_and_vote_counters(mission, vote);
    });

    socket.on("you_are_leader", function(data){
        console.log('fucking leader!');
        console.log(data);
        propose_team_prompt(data['team_size'], data['players']);
    });

    socket.on("show_reveal_role_to_all_button", function(){
        show_reveal_role_to_all_button();
    });

    socket.on("assassination_result", function(data){
        console.log('result!');
        var success = data['success'];
        var selected_player = data['selected_player'];
        var role = data['role'];
        reveal_assassinated_player_role(success, selected_player, role);
    });

    socket.on("player_reveals_role", function(data){
        var player_id = data['player_id'];
        var role = data['role'];
        show_player_role(player_id, role);
    });

    socket.on("waiting_for_team", function(data){
        var leader = data['leader'];
        var proposed_team = data['selected_player_names'];
        show_waiting_for_team_message(leader, proposed_team);
    });

    socket.on("selected_player", function(player_id) {
        $('#mission_player_id_' + player_id).append(selected_icon_html);
    });

    socket.on("deselected_player", function(player_id){
        $('#mission_player_id_' + player_id).empty();
    });

    socket.on("selected_player_to_assassinate", function(player_id) {
        player_selected_to_be_assassinated(player_id);
    });

    socket.on("deselected_player_to_assassinate", function(player_id){
        player_deselected_to_be_assassinated(player_id);
    });

    socket.on("you_are_on_team", function(data){
        var is_spy = data['is_spy'];
        var selected_player_names = data['selected_player_names'];
        var leader = data['leader'];
        console.log("SHOW THE FUCKING CARDS");
        show_mission_cards(is_spy, selected_player_names, leader);
        console.log(data);
    });

    socket.on("vote_result", function(data){
        var proposal_approved = data['proposal_approved'];
        var vote_results = data['vote_results'];
        var players = data['players'];
        var proposed_team = data['proposed_team'];
        var next_player_name = data['next_player_name'];
        console.log(data);
        show_vote_result(proposal_approved, vote_results, players, proposed_team, next_player_name);
    });

    socket.on("mission_result", function(data){
        var mission_success = data['mission_success'];
        var mission_result = data['mission_result'];
        var leader = data['leader'];
        var team_members = data['team_members'];
        var next_player_name = data['next_player_name'];
        var game_round = data['mission_round'];
        console.log(data);
        show_mission_result(leader, team_members, mission_success, mission_result, game_round);
    });

    socket.on("team_proposed", function(data){
        console.log("TEAM PROP");
        var selected_player_names = data['selected_player_names'];
        var leader = data['leader'];
        show_proposed_team(leader, selected_player_names);
        console.log(data);

    });

    socket.on("game_over_avalon_assassin", function(data){
        var players = data['players'];
        console.log("BLUE WINS TIME TO ASSASSINATE");
        show_assassination_panel(players, true);
    });

    socket.on("game_over_avalon", function(data){
        var players = data['players'];
        console.log("BLUE WINS TIME TO ASSASSINATE BUT WE NOT ASSASSIN");
        show_assassination_panel(players, false);
    });
});