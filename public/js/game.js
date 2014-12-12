var socket = io('/avalon');
var leader_icon_html = '<img src = "images/leader.png" height = "20" width = "20">';
var selected_icon_html = '<img src = "images/selected.png" height = "20" width = "20">';
var assassination_icon_html = '<span id = "assassination_icon"><img src = "images/dagger.png" height = "20" width = "20"></span>';
var role_wait_time = .1;
var vote_wait_time = .1;
var mission_wait_time = .1;
var message_elem;
var saved_data = {};
var assassassination_over = false;
function is_phone_screen (){
    return $(window).width() < 470;
}
function is_small_screen (){
    return $(window).width() < 768;
}
function get_button_size(){
    if(is_small_screen()){
        return 'btn-xs';
    }else{
        return 'btn-lg';
    }
}
function get_game_id (){
    var game_id_elem = $('#game_id');
    return game_id_elem.html();
}

function get_player_id (){
    return $('.playerID').attr('id');
}

function get_player_name(){
    return $('.playerID').html();
}

function add_player_colors_to_header(player_colors){
    for(p in player_colors[0]){ //id
        $('html > head').append($('<style>.player_id_'+p+'_color { background: ' + player_colors[0][p] + '; height: 10px; width: 10px; display: inline-block;}</style>'));
        console.log(p);
    }
    for(p in player_colors[1]){ //name
        $('html > head').append($('<style>.player_name_'+p+'_color { background: ' + player_colors[1][p] + '; height: 10px; width: 10px; display: inline-block;}</style>'));
        console.log(p);
    }
}

function make_leader (leader_id, leader_name){
    clear_old_leaders();
    reset_selected_players();
    var elem = $('#player_id_' + leader_id);
    var icon_elem = $('#leader_player_id_' + leader_id);
    elem.addClass('leader');
    icon_elem.append(leader_icon_html);
    show_waiting_for_leader_message(leader_name);
}

function show_waiting_for_leader_message(leader_name){
    clear_messages();
    var proposal_html = 'Waiting for <div class="player_name_' + leader_name + '_color"></div>' + leader_name + ' to make a team...';
    $("#game_messages").append(proposal_html);
}

function clear_messages(){
    console.log("CLEARING FUCKING MESSAGES");
    $("#game_messages").empty();
    $("#game_messages_modal").empty();
}
function clear_modal(){
    $("#game_messages_modal").empty();
}
function clear_old_leaders(){
    $(".leader").removeClass('leader');
    $(".leader_col").empty();

}

function reset_selected_players(){
    $(".mission_col").empty();
    $("#propose").remove();
    $('.player_class').removeClass('selected_for_team');

}
function save_data(key, data){
    if(!(key in data)){
        saved_data[key] = data;
    }
}
function clear_data(key){
    delete saved_data[key];
}
function data_exists(key){
    return (key in saved_data);
}
function propose_team_prompt (team_size, players){
    var proposed_team_data = {};
    var proposed_team_key = 'propose_team';
    var selected_players = [];
    if(data_exists(proposed_team_key)){
        selected_players = saved_data[proposed_team_key]['selected_players'];
        console.log(selected_players);
    }
    var html = "propose a team of size " + team_size;
    html += '<div id = "close_propose" style="float: right"><button type="button" id = "close_propose_button" class = "btn btn-default ' + get_button_size() + '">Close</button></div>';

    if(!is_phone_screen()){
        html += " by clicking on their names below ";
    }
    html += "<br />";
    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><caption class = "extra_info">SCOREBOARD</caption><thead></thead><tr><th class = "extra_info">Player</th><th class = "extra_info">Selected?</th></tr><tbody class="players-to-select">';
    var players = players;

    for(var i = 0; i < players.length; i++){
        player_table_html += '<tr id="player_id_' + players[i]['id'] + '_to_select"><td><div class="player_name_' + players[i]['name'] + '_color"></div>' + players[i]['name'] + '</td><td id="' + players[i]['id'] + '_selected_status">Not Selected</td></tr>';
    }
    player_table_html += '</tbody></table>';

    message_elem.html(html + player_table_html);

    $('#close_propose_button').click(function(){
        close_button();
    });
    for(var i = 0; i < players.length; i++){
        var player_id = players[i]['id'];
        if(selected_players.indexOf(player_id) > -1){
            $('#player_id_' + player_id + '_to_select').addClass("selected");
            $('#' + player_id + '_selected_status').html("Selected");
            if(is_phone_screen()){
                $('#player_id_' + player_id).addClass('selected_for_team');
            }else{
                $('#mission_player_id_' + player_id).append(selected_icon_html);
            }
        }
    }
    if(total_selected_players() == team_size){
        show_propose_button();
    }
    if(is_phone_screen()){
        if(players.length  == 10){
            $('.players-to-select').css('font-size', '7pt');
        } else if(players.length  == 9){
            $('.players-to-select').css('font-size', '8pt');
        }else if(players.length  == 8){
            $('.players-to-select').css('font-size', '9pt');
        }
    }

    if(is_small_screen()){
        show_unclosable_modal(false);
    }

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
                if(is_phone_screen()){
                    $('#player_id_' + player_id).addClass('selected_for_team');
                }else{
                    $('#mission_player_id_' + player_id).append(selected_icon_html);
                }
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
            if(is_phone_screen()){
                $('#player_id_' + player_id).removeClass('selected_for_team');
            }else{
                $('#mission_player_id_' + player_id).empty();
            }
            socket.emit("deselected_player", {game_id: get_game_id(), player_id: get_player_id(), selected_id: player_id});
            if(total_selected_players() < team_size){
                remove_propose_button();
            }
        }
    }

    function is_selected(player_id){
        return $('#' + player_id + '_selected_status').html() == "Selected";
    }
    function close_button(){
        proposed_team_data['team_size'] = team_size;
        proposed_team_data['players'] = players;
        proposed_team_data['selected_players'] = selected_players;
        save_data(proposed_team_key, proposed_team_data);
        $('#myModal').modal('hide');
        show_propose_team_button(team_size, players);
    }
    function show_propose_button(){
        var button = '<div id = "propose"><button type="button" id = "propose_button" class = "btn btn-danger ' + get_button_size() + '">Propose Team</button></div>';
        message_elem.append(button);
        $('#propose').css('text-align', 'center');
        $('#propose').click(function(){
            if(is_small_screen()){
                $('#myModal').modal('hide');
            }
            clear_data(proposed_team_key);
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
    var team_html = '<div class = "row"><div class = "col-xs-12"><div class="player_name_' + leader + '_color"></div>' + leader + " has proposed";
    if(!is_phone_screen()){
        team_html += ' a team consisting of';
    }
    team_html += ' ';
    var to_join_html = [];
    for(var i = 0; i < proposed_team.length; i++){
        to_join_html.push('<div class="player_name_' + proposed_team[i] + '_color"></div>'+ proposed_team[i]);
    }
    team_html += to_join_html.join(', ');

    team_html += '</div><div class = "row-fluid" id = "mission_row" ><div class = "col-xs-6" id = "pass_mission_div"></div><div class = "col-xs-6" id = "fail_mission_div"></div></div><br>';
    $("#game_messages").append(team_html);
    var mission_div_location = $("#pass_mission_div").offset();
    var bottom_padding = 30;
    var remaining_height = $(window).height() - mission_div_location.top - bottom_padding;
    var height_to_width_ratio = 98/75;
    var remaining_width = $(window).width() / 2; //for 2 cards
    var new_width = 0;
    var new_height = 0;
    if(remaining_width * height_to_width_ratio > remaining_height){
        new_height = remaining_height;
        console.log(new_height);
    } else{
        new_height = remaining_width * height_to_width_ratio;
        console.log(new_height);
    }
    new_width = (new_height / height_to_width_ratio);
    var pass_image_html = '<img src = "images/approve_team.png", id = "success_mission", width =  ' + new_width + ', height =  ' + new_height + ', class = "success_mission_img not_selected">';
    var fail_image_html = '<img src = "images/reject_team.png" id = "fail_mission", width = ' + new_width + ', height =  ' + new_height + ', class = "fail_mission_img not_selected">';
    if(is_phone_screen()){
        pass_image_html = '<button type="button" id = "success_mission" class="not_selected btn btn-success btn-block ' + get_button_size() + '" data-toggle="button" aria-pressed="false">Pass</button>';
        fail_image_html = '<button type="button" id = "fail_mission" class="not_selected btn btn-danger btn-block ' + get_button_size() + '" data-toggle="button" aria-pressed="false">Fail</button>';
    }
    $("#pass_mission_div").append(pass_image_html);
    $("#fail_mission_div").append(fail_image_html);

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
        var button = '<div id = "submit_mission", class = "row"><button type="button" id = "submit_mission_button" class = "btn btn-block btn-warning ' + get_button_size() + '">Submit ' + submission + '</button></div>';
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
    var proposal_html = '<div class="player_name_' + leader + '_color"></div>' + leader + ' has proposed';
    if(!is_phone_screen()){
        proposal_html += " a team consisting of";
    }
    proposal_html += ":<ul>";
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
    var proposal_html = '<div class = "row"><div class = "col-xs-12"><div class="player_name_' + leader + '_color"></div>' + leader + ' has proposed';
    if(!is_phone_screen()){
        proposal_html += " a team consisting of";
    }
    proposal_html += ' ';
    var to_join_html = [];
    for(var i = 0; i < proposed_team.length; i++){
        to_join_html.push('<div class="player_name_' + proposed_team[i] + '_color"></div>'+ proposed_team[i]);
    }
    proposal_html += to_join_html.join(', ');

    proposal_html += '</div><div class = "row-fluid" id = "voting_row" ><div class = "col-xs-6" id = "success_voting_div"></div><div class = "col-xs-6" id = "reject_voting_div"></div></div><br>';
    $("#game_messages").append(proposal_html);
    var voting_div_location = $("#success_voting_div").offset();
    console.log(voting_div_location);
    var bottom_padding = 30;
    var remaining_height = $(window).height() - voting_div_location.top - bottom_padding;
    var height_to_width_ratio = 98/75;
    var remaining_width = $(window).width() / 2; //for 2 cards
    var new_width = 0;
    var new_height = 0;
    if(remaining_width * height_to_width_ratio > remaining_height){
        new_height = remaining_height;
        console.log('new_height');
        console.log(new_height);
    } else{
        new_height = remaining_width * height_to_width_ratio;
        console.log('new_height2');
        console.log(new_height);
    }
    new_width = (new_height / height_to_width_ratio);
    console.log('offset');
    console.log(new_width);
    var success_image_html = '<img src = "images/approve_team.png", id = "approve_team", width =  ' + new_width + ', height =  ' + new_height + ', class = "not_selected">';
    var reject_image_html = '<img src = "images/reject_team.png" id = "fail_team", width = ' + new_width + ', height =  ' + new_height + ', class = "not_selected">';
    if(is_phone_screen()){
        success_image_html = '<button type="button" id = "approve_team" class="not_selected btn btn-default btn-block ' + get_button_size() + '" data-toggle="button" aria-pressed="false">Approve</button>';
        reject_image_html = '<button type="button" id = "fail_team" class="not_selected btn btn-reject btn-block ' + get_button_size() + '" data-toggle="button" aria-pressed="false">Reject</button>';
    }
    $("#success_voting_div").append(success_image_html);
    $("#reject_voting_div").append(reject_image_html);


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

    function show_vote_button(vote) {
        var button = '<div id = "vote", class = "row"><button type="button" id = "vote_button" class="btn btn-block btn-info ' + get_button_size() + '">Confirm ' + vote + '</button></div>';
        $("#game_messages").append(button);
        if (is_phone_screen()) {
            $("#vote_button").removeClass('btn-info');
            if (vote == 'Approve') {
                $("#vote_button").addClass('btn-default');
            } else {
                $("#vote_button").addClass('btn-reject');
            }
        }
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
    $('#game_messages_modal').append(countdown_html);
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
            $('#myModal').modal('hide');
            console.log("CLEARED FROM TIMEOUT");
            callback();

        }, seconds*1000);
}
function done_with_voting_results(){
    socket.emit("done_with_voting_results", {game_id: get_game_id(), player_id: get_player_id()});
}
function show_vote_result(proposal_approved, vote_results, players, proposed_team, next_player_name, leader_name, reshow){
    if(reshow){
        clear_modal();
    }else{
        clear_messages();
    }
    console.log("SHGOWING RESULT");


    var html = 'THE PROPOSAL BY <b><div class="player_name_' + leader_name + '_color"></div>' + leader_name + '</b> ';
    if(proposal_approved){
        html += "PASSED (<span id = 'voting_breakdown'></span>)";
    } else{
        html += 'FAILED (<span id = "voting_breakdown"></span>). LEADERSHIP WILL PASS TO <div class="player_name_' + next_player_name + '_color"></div>' + next_player_name;
    }
    html += "<br>";
    if(reshow){
        html += 'Click anywhere to close';
    }
    var votes_for = 0;
    var player_table_html = '<table class="table table-bordered table-condensed scoreboard-table"><caption class = "extra_info">VOTING RESULTS</caption><thead></thead><tr><th class = "extra_info">Player</th><th class = "extra_info"></th><th class = "extra_info">VOTE</th></tr><tbody class="players-to-select">';
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
            votes_for += 1;
        } else{
            voting_class = 'rejected_vote';
        }
        player_table_html += '<tr id="player_id_' + player_id + '_vote_result", class = "row-fluid';
        if(in_team){
            player_table_html += ' selected_for_team';
        }
        player_table_html += '"><td class = "cs-xs-1 ';
        if(is_phone_screen()){
            if(player_name == leader_name && in_team){
                player_table_html += ' leader-cell-selected';
            }else if(player_name == leader_name){
                player_table_html += ' leader-cell';
            }else if(in_team){
                player_table_html += ' selected-cell';
            }
        }
        player_table_html += '"></td><td class = "cs-xs-6  '+ voting_class  + '"><div class="player_name_' + player_name + '_color"></div>' + player_name + '</td>';
        if(in_team){
            if(!is_phone_screen()) {
                player_table_html += '<img class = "selected_icon" src="images/selected.png" height="20" width="20">';
            }
        }
        player_table_html += '</td>';
        player_table_html += '<td class = "cs-xs-5 '+ voting_class  + '">' + vote_results[player_name] + '</td></tr>';


    }
    player_table_html += '</tbody></table>';
    $('#game_messages_modal').append(html + player_table_html);
    var voting_breakdown_html = votes_for + " - " + (players.length-votes_for);
    $('#voting_breakdown').append(voting_breakdown_html);
    if(is_phone_screen()){
        if(players.length  == 10){
            $('.players-to-select').css('font-size', '7pt');
        } else if(players.length  == 9){
            $('.players-to-select').css('font-size', '8pt');
        }else if(players.length  == 8){
            $('.players-to-select').css('font-size', '9pt');
        }
    }
    if(!reshow){
        show_countdown(vote_wait_time, done_with_voting_results);
    }
    if(reshow){
        enable_modal_close();
    }
    console.log(reshow);
    show_unclosable_modal(reshow);
}

function done_with_mission_results(){
    $('body').removeClass("failed_mission");
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
    $('#mission_' + mission).removeClass('current_mission');

}
function add_leader_names(leaders){
    for(var i = 0 ; i < leaders.length; i++){
        $('#vote_leader_' + (i+1)).html('<div class="player_name_' + leaders[i] + '_color"></div>' + leaders[i]);
    }
}
function update_mission_and_vote_counters(mission, vote, leaders){
    clear_vote_track();
    if(vote==1){
        add_leader_names(leaders);
    }
    set_vote_track(vote);
    set_mission_in_progress(mission);
}
function show_mission_result(leader, team_members, mission_success, mission_result, game_round, reshow){
    if(reshow){
        clear_modal();
    }else{
        clear_messages();
    }

    console.log("MSG RESULT");

    var html = "THE MISSION ";
    if(mission_success){
        html += "SUCCEEDED!";
    } else{
        html += "FAILED!";
        $('body').addClass("failed_mission");
    }
    if(reshow){
        html += ' Click anywhere to close';
    }
    html += "<br><div class = 'row-fluid mission_result_row'></div>";
    set_mission_result(game_round, mission_success);
    var mission_result_html = '';
    var col_width = 'col-xs-' + (12/mission_result.length);
    for(var i = 0; i < mission_result.length; i++){
        if(mission_result[i] == "Success"){
            mission_result_html += '<div class = "success_mission_slot ' + col_width + '"></div>';
        }else{
            mission_result_html += '<div class = "fail_mission_slot ' + col_width + '"></div>';
        }
    }
    var team_html = '<br><div class="player_name_' + leader + '_color"></div>' + leader + " proposed a team consisting of: <br> ";
    var members_to_join = [];
    for(var i = 0; i < team_members.length; i++){
        members_to_join.push('<div class="player_name_' + team_members[i] + '_color"></div>' + team_members[i]);
    }
    team_html += members_to_join.join(', ');
    $('#game_messages_modal').append(html + team_html);
    $('.mission_result_row').append(mission_result_html);
    var success_mission_img = '<img class="success_mission_img" src="images/success_mission.png" height="98" width="75">';
    var fail_mission_img = '<img class="fail_mission_img" src="images/fail_mission.png" height="98" width="75">';
    if(is_phone_screen()){
        $('.success_mission_slot').addClass('success_cell');
        $('.fail_mission_slot').addClass('fail_cell');
        success_mission_img = 'PASS';
        fail_mission_img = 'FAIL';
    }
    $('.success_mission_slot').append(success_mission_img);
    $('.fail_mission_slot').append(fail_mission_img);

    if(reshow){
        enable_modal_close();
        enable_remove_red_from_bg_if_fail();
    }
    console.log(reshow);
    show_unclosable_modal(reshow);
    if(!reshow){
        show_countdown(mission_wait_time, done_with_mission_results);
    }

}
function enable_remove_red_from_bg_if_fail(){
    $('#myModal').on('hidden.bs.modal', function (e) {

        if($('body').hasClass("failed_mission")){
            $('body').removeClass("failed_mission");
        }
        $('#myModal').off('hidden.bs.modal');
    });
}
function done_with_role_info(){
    socket.emit("done_with_role_info", {game_id: get_game_id(), player_id: get_player_id()});
}
function enable_modal_close(){
    $('#myModal').data('bs.modal').options.keyboard = true;
    $('#myModal').data('bs.modal').options.backdrop = true;
    $('#myModal').click(function(){
        $('#myModal').modal('hide');
    });
}
function show_unclosable_modal(reshow){
    $('#myModal').modal({
        keyboard: reshow,
        backdrop: reshow ? true : "static"
    });
    $('#myModal').data('bs.modal').options.keyboard = reshow;
    $('#myModal').data('bs.modal').options.backdrop = reshow ? true : "static";
    if(!reshow){
        $('#myModal').off('click');
    }
}
function show_role_info(role, info, reshow){
    if(reshow){
        clear_modal();
    }else{
        clear_messages();
    }

    if(reshow){
        enable_modal_close();
    }
    console.log(reshow);
    show_unclosable_modal(reshow);
    console.log("SHGOWING ROLE");
    var relevant_players = info['relevant_players'];
    if(!reshow){
        show_countdown(role_wait_time, done_with_role_info);
    }
    var html = 'You are <b> ' + role + '</b><br>' + info['html'];
    if(role != "Assassin"){
        location.reload();
    }
    if(reshow){
        html += '<br>Click anywhere to close';
    }
    $('#game_messages_modal').append(html);
    if(relevant_players !== null){
        flash_relevant_players(relevant_players, reshow);
    }
}
function flash_relevant_players(relevant_players, reshow) {
    console.log("RELEVANT PS");
    console.log(relevant_players);
    for (var i = 0; i < relevant_players.length; i++) {
        var player_id = relevant_players[i]['id'];
        var elem = $('#player_id_' + player_id);
        elem.addClass('relevant_player');
    }
    if (reshow) {
        $('#myModal').on('hidden.bs.modal', function (e) {
            for (var i = 0; i < relevant_players.length; i++) {
                var player_id = relevant_players[i]['id'];
                var elem = $('#player_id_' + player_id);
                elem.removeClass('relevant_player');
            }
        })
    } else {
        setTimeout(function () {
            for (var i = 0; i < relevant_players.length; i++) {
                var player_id = relevant_players[i]['id'];
                var elem = $('#player_id_' + player_id);
                elem.removeClass('relevant_player');
            }
        }, role_wait_time * 1000);
    }
}
function show_show_last_vote_button(){
    var button_text = "Show Last Vote";
    var button = '<span id = "show_last_vote"><button type="button" id = "show_last_vote_button" class="btn btn-primary ' + get_button_size() + '">' + button_text + '</button></span>';
    $("#game_buttons").append(button);
    $('#show_last_vote_button').click(function(){
        socket.emit("show_last_vote", {game_id: get_game_id(), player_id: get_player_id()});
    });
}

function show_show_last_mission_button(){
    var button_text = "Show Last Mission";
    var button = '<span id = "show_last_mission"><button type="button" id = "show_last_mission_button" class="btn btn-primary ' + get_button_size() + '">' + button_text + '</button></span>';
    $("#game_buttons").append(button);
    $('#show_last_mission_button').click(function(){
        socket.emit("show_last_mission", {game_id: get_game_id(), player_id: get_player_id()});
    });
}
function show_reshow_role_button(){
    $("#game_buttons").css("display", "block");
    show_show_role_button(true);
}
function show_show_role_button(reshow){
    if(reshow){
        clear_modal();
    }else{
        clear_messages();
    }
    var button_text = reshow ? "Reshow " : "Show ";

    var button = '<span id = "role"><button type="button" id = "role_button" class="btn btn-primary ' + get_button_size() + '">' + button_text + 'My Role!</button></span>';
    $('#role').css( 'margin','0 auto');
    $('#role').css( 'display','table');
    if(reshow){
        $("#game_buttons").append(button);
    }else{
        $("#game_messages").append(button);
    }
    $('#role_button').click(function(){
        if(reshow){
            socket.emit("reshow_my_role", {game_id: get_game_id(), player_id: get_player_id()});
        }else{
            socket.emit("ready_for_role", {game_id: get_game_id(), player_id: get_player_id()});
        }

    });
}
function show_choose_assassination_button(players){
    if($("#ready_to_assassinate").length == 0) {
        var button = '<div id = "ready_to_assassinate"><button type="button" id = "ready_to_assassinate_button" class = "btn btn-danger ' + get_button_size() + '">Assassinate!</button></div>';
        $('#game_messages').append(button);
        $('#ready_to_assassinate_button').click(function () {
            console.log('propose a team');
            show_unclosable_modal(false);
            $("#ready_to_assassinate").remove();
            show_assassination_panel(players, true);
        });
    }
}
function show_show_assassination_button(players){
    if($("#see_assassination").length == 0) {
        var button = '<div id = "see_assassination"><button type="button" id = "see_assassination_button" class = "btn btn-primary ' + get_button_size() + '">See Assination Results</button></div>';
        $('#game_buttons').append(button);
        $('#see_assassination_button').click(function(){
            show_assassination_panel(players, false);
        });
    }
}
function show_assassination_panel (players, is_assassin){
    if(assassassination_over){
        show_unclosable_modal(false);
        return;
    }
    var html = "";
    var modal_html_header = '';
    var selected_player = null;
    var assassination_data = {};
    if(is_assassin) {
        modal_html_header = "SELECT WHO YOU THINK IS MERLIN";
        if(!is_phone_screen()){
            modal_html_header = " BY CLICKING ON THEIR NAMES";
        }
        show_choose_assassination_button(players)
        var assassination_key = 'assassination';
        selected_player = null;
        if(data_exists(assassination_key)){
            selected_player = saved_data[assassination_key]['selected_player'];
        }
    }else{
        html = "WAITING FOR ASSASSIN";
        modal_html_header = 'ASSASSINATION';
    }
    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><thead></thead><tr><th>Player</th><th>Role</th></tr><tbody class="players-to-assassinate">';
    var players = players;
    console.log(players);

    for(var i = 0; i < players.length; i++){
        player_table_html += '<tr id="player_id_' + players[i]['id'] + '_to_assassinate"><td><div class="player_name_' + players[i]['name'] + '_color"></div>' + players[i]['name'] + '</td><td id = "player_id_' + players[i]['id'] + '_role"></td></tr>';
    }
    modal_html_header += '<div id = "close_assassination" style="float: right"><button type="button" id = "close_assassination_button" class = "btn btn-default ' + get_button_size() + '">Close</button></div>';
    player_table_html += '</tbody></table>';
    if(is_phone_screen() && !is_assassin){
        $('#game_messages').html(html);
    }
    $('#game_messages_modal').html(modal_html_header + player_table_html);

    $('#close_assassination_button').click(function(){
        close_button();
    });
    function close_button(){
        console.log("CLOSED ASSASS BUT");
        console.log(assassassination_over);
        assassination_data['players'] = players;
        assassination_data['selected_player'] = selected_player;
        save_data(assassination_key, assassination_data);
        $('#myModal').modal('hide');
        if(is_assassin && !assassassination_over) {
            show_choose_assassination_button(players);
        }
        if(assassassination_over){
            show_show_assassination_button(players);
        }
    }
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
        var button = '<div id = "assassinate"><button type="button" id = "assassinate_button" class="btn btn-danger ' + get_button_size() + '">Assassinate ' + player_name + '</button></div>';
        $("#game_messages_modal").append(button);
        $('#assassinate').click(function(){
            console.log('assassinated!!!');
            clear_data(assassination_key);
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
    console.log(player_id);
    $('#player_id_' + player_id + '_to_assassinate').addClass("selected");
    $('#player_id_' + player_id + '_to_assassinate').children('td:nth-child(1)').append(assassination_icon_html);
    if(is_phone_screen()){
        $('#player_id_' + player_id).addClass('selected_to_be_assassinated');
    }
}

function player_deselected_to_be_assassinated(player_id){
    $('#player_id_' + player_id + '_to_assassinate').removeClass("selected");
    if(is_phone_screen()){
        $('#player_id_' + player_id).removeClass('selected_to_be_assassinated');
    }
    $('#assassination_icon').remove();
}

function show_end_game_player_panel (players, did_blue_win){
    assassassination_over = true;
    var html = "";
    var player_table_html = '<table class="table table-bordered table-hover table-condensed scoreboard-table"><thead></thead><tr><th>Player</th><th>Role</th></tr><tbody class="end_game_players_list">';
    var players = players;
    console.log(players);
    var selected_player = null;
    for(var i = 0; i < players.length; i++){
        player_table_html += '<tr id="end_game_player_id' + players[i]['id'] + '"><td>' + players[i]['name'] + '</td><td id = "player_id_' + players[i]['id'] + '_role"></td></tr>';
    }
    player_table_html += '</tbody></table>';
    $('#game_messages').html(html + player_table_html);
    if(did_blue_win){
        blue_wins();
    }else{
        red_wins();
    }
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

function show_propose_team_button(team_size, players){
    var button = '<div id = "ready_to_propose_team"><button type="button" id = "ready_to_propose_team_button" class = "btn btn-danger ' + get_button_size() + '">Propose a Team</button></div>';
    $('#game_messages').append(button);
    $('#ready_to_propose_team').click(function(){
        console.log('propose a team');
        $("#ready_to_propose_team").remove();
        propose_team_prompt(team_size, players);
    });
}

function reveal_assassinated_player_role(success, selected_player, role){
    assassassination_over = true;
    if(is_phone_screen()){
        var animating_strikeout = true;

        var assassinated_player_name = $('#player_id_' + selected_player + '_name').text();
        function StrikeThrough(index) {
            if (index >= assassinated_player_name.length){
                $('#player_id_' + selected_player).addClass('assassinated');
                if(!$("#myModal").data('bs.modal').isShown){
                    show_unclosable_modal(false);
                }
                if (success) {
                    $('#player_id_' + selected_player + '_to_assassinate').addClass("successful_assassination");
                    red_wins();
                } else {
                    $('#player_id_' + selected_player + '_to_assassinate').addClass("failed_assassination");
                    blue_wins();
                }
                show_player_role(selected_player, role);
                return false;
            }

            var sToStrike = "<span style='color:black'>" + assassinated_player_name.substr(0, index + 1) + "<span>";
            var sAfter = (index < (assassinated_player_name.length - 1)) ? assassinated_player_name.substr(index + 1, assassinated_player_name.length - index) : "";
            $('#player_id_' + selected_player + '_name').html('<s style="color:darkred">' + sToStrike + '</s>' + sAfter);
            window.setTimeout(function() {
                StrikeThrough(index + 1);
            }, 100);
        }
        StrikeThrough(0);
    }
    else {
        if (success) {
            $('#player_id_' + selected_player + '_to_assassinate').addClass("successful_assassination");
            red_wins();
        } else {
            $('#player_id_' + selected_player + '_to_assassinate').addClass("failed_assassination");
            blue_wins();
        }
        show_player_role(selected_player, role);
    }
}

function show_player_role(player_id, role){
    $('#player_id_' + player_id + '_role').append(role);
}
function red_wins(){
    var winning_team = "RED";
    $('#game_messages').html(winning_team + " WINS!");
    $(body).css("background-color","#FF6961");
    show_restart_button();
}

function blue_wins(){
    var winning_team = "BLUE";
    $('#game_messages').html(winning_team + " WINS!");
    $(body).css("background-color","#B3DDEB");
    show_restart_button();
}
function show_restart_button(){
    /* figure out this logic later basically only restart if everyone clicked restart, until then i cop out
    var button = '<div id = "restart_game"><button type="button" id = "restart_game_button">Restart Game with Same Roles and Players</button></div>';
    console.log('restartdd');
    $('#game_messages').append(button);
    $('#restart_game').click(function(){
        console.log('restart game!');
        $("#restart_game").remove();
        $(body).css("background-color","transparent");
        for(var i = 1; i < 6; i++){
            $('#mission_' + i).removeClass('mission_failed');
            $('#mission_' + i).removeClass('mission_success');
            $('#mission_' + i).removeClass('current_mission');
        }
        clear_vote_track();
        socket.emit("start_game", get_game_id());
        socket.emit("game_started", {game_id: get_game_id(), player: {id: get_player_id(), name: get_player_name()}});
    });
    */
    var button = '<div id = "to_lobby"><button type="button" id = "to_lobby_button" class = "to_lobby_button btn btn-primary ' + get_button_size() + '">Back to Lobby</button></div>';
    $('#game_messages_modal').append(button);
    $('#game_buttons').append(button);
    $('.to_lobby_button').click(function(){
        window.location.href = "../";
    });
}
$(document).ready(function() {
    message_elem = is_small_screen() ? $('#game_messages_modal') : $('#game_messages');
    var player_id = $('.playerID').attr('id');
    var player_name = $('.playerID').html();
    socket.emit("game_started", {game_id: get_game_id(), player: {id: player_id, name: player_name}});
    socket.on("set_player_colors", function(data){
        var game_id = data['game_id'];
        var player_colors = data['player_colors'];
        add_player_colors_to_header(player_colors);
    });


    socket.on("new_leader", function(data){
        var leader_id = data['leader_id'];
        var leader_name = data['leader_name'];
        console.log(leader_id);
        make_leader(leader_id, leader_name);
    });

    socket.on("show_player_roles", function(data){
        var my_role = data['role'];
        var info = data['role_information'];
        var relevant_players = data['relevant_players'];
        show_role_info(my_role, info, false);
    });

    socket.on("reshow_player_roles", function(data){
        var my_role = data['role'];
        var info = data['role_information'];
        var relevant_players = data['relevant_players'];
        show_role_info(my_role, info, true);
    });

    socket.on("are_you_ready_for_role", function(){
        show_show_role_button(false);
    });

    socket.on("waiting_for_everyone", function(){
        show_waiting_for_players_to_check_roles_message();
    });


    socket.on("game_round_vote_count", function(data){
        var mission = data['mission'];
        var vote = data['vote'];
        var leaders = data['leaders'];
        update_mission_and_vote_counters(mission, vote, leaders);
    });

    socket.on("you_are_leader", function(data){
        console.log('fucking leader!');
        console.log(data);
        show_propose_team_button(data['team_size'], data['players']);

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
        if(is_phone_screen()){
            $('#player_id_' + player_id).addClass('selected_for_team');
        }else{
            $('#mission_player_id_' + player_id).append(selected_icon_html);
        }

    });

    socket.on("deselected_player", function(player_id){
        if(is_phone_screen()){
            $('#player_id_' + player_id).removeClass('selected_for_team');
        }else{
            $('#mission_player_id_' + player_id).empty();
        }
    });

    socket.on("selected_player_to_assassinate", function(player_id) {
        player_selected_to_be_assassinated(player_id);
    });

    socket.on("deselected_player_to_assassinate", function(player_id){
        player_deselected_to_be_assassinated(player_id);
    });

    socket.on("game_started", function(){
       show_reshow_role_button();
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
        var leader_name = data['leader_name'];
        if(data['mission_number'] == 1 && data['vote_number'] == 1){
            show_show_last_vote_button();
        }
        console.log(data);
        show_vote_result(proposal_approved, vote_results, players, proposed_team, next_player_name, leader_name, false);
    });

    socket.on("showing_last_vote", function(data){
        var proposal_approved = data['proposal_approved'];
        var vote_results = data['vote_results'];
        var players = data['players'];
        var proposed_team = data['proposed_team'];
        var next_player_name = data['next_player_name'];
        var leader_name = data['leader_name'];
        console.log(data);
        show_vote_result(proposal_approved, vote_results, players, proposed_team, next_player_name, leader_name, true);
    });

    socket.on("showing_last_mission", function(data){
        var mission_success = data['mission_success'];
        var mission_result = data['mission_result'];
        var leader = data['leader'];
        var team_members = data['team_members'];
        var next_player_name = data['next_player_name'];
        var game_round = data['mission_round'];
        console.log(data);
        show_mission_result(leader, team_members, mission_success, mission_result, game_round, true);
    });

    socket.on("mission_result", function(data){
        var mission_success = data['mission_success'];
        var mission_result = data['mission_result'];
        var leader = data['leader'];
        var team_members = data['team_members'];
        var next_player_name = data['next_player_name'];
        var game_round = data['mission_round'];
        if(game_round == 1){
            show_show_last_mission_button();
        }
        console.log(data);
        show_mission_result(leader, team_members, mission_success, mission_result, game_round, false);
    });

    socket.on("team_proposed", function(data){
        console.log("TEAM PROP");
        var selected_player_names = data['selected_player_names'];
        var leader = data['leader'];
        show_proposed_team(leader, selected_player_names);
        console.log(data);

    });

    socket.on("game_over_avalon_assassin", function(data){
        clear_old_leaders();
        reset_selected_players();
        var players = data['players'];
        console.log("BLUE WINS TIME TO ASSASSINATE");
        show_assassination_panel(players, true);
    });

    socket.on("game_over_avalon", function(data){
        clear_old_leaders();
        reset_selected_players();
        var players = data['players'];
        console.log("BLUE WINS TIME TO ASSASSINATE BUT WE NOT ASSASSIN");
        show_assassination_panel(players, false);
    });

    socket.on("game_over", function(data){
        clear_old_leaders();
        reset_selected_players();
        var players = data['players'];
        var result = data['result'];
        console.log("BLUE WINS TIME TO ASSASSINATE BUT WE NOT ASSASSIN");
        show_end_game_player_panel(players, result);
    });
});