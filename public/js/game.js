var socket = io('/avalon');
var leader_icon_html = '<img src = "images/leader.png" height = "20" width = "20"></img>';
var selected_icon_html = '<img src = "images/selected.png" height = "20" width = "20"></img>';
function get_game_id (){
    var game_id_elem = $('#game_id');
    return game_id_elem.html();
}

function get_player_id (){
    return $('.playerID').attr('id');
}

function make_leader (leader_id){
    var elem = $('#player_id_' + leader_id);
    var icon_elem = $('#leader_player_id_' + leader_id);
    elem.addClass('leader');
    icon_elem.append(leader_icon_html);
}

function clear_messages(){
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

$(document).ready(function() {
    var player_id = $('.playerID').attr('id');
    var player_name = $('.playerID').html();
    socket.emit("game_started", {game_id: get_game_id(), player: {id: player_id, name: player_name}});



    socket.on("new_leader", function(leader_id){
        console.log(leader_id);
        make_leader(leader_id);
    });

    socket.on("you_are_leader", function(data){
        console.log('fucking leader!');
        console.log(data);
        propose_team_prompt(data['team_size'], data['players']);
    });

    socket.on("selected_player", function(player_id){
        $('#mission_player_id_' + player_id).append(selected_icon_html);
    });

    socket.on("deselected_player", function(player_id){
        $('#mission_player_id_' + player_id).empty();
    });

    socket.on("you_are_on_team", function(data){
        var is_spy = data['is_spy'];
        var selected_player_names = data['selected_player_names'];
        console.log(data);
    });

    socket.on("team_proposed", function(data){
        console.log("TEAM PROP");
        var selected_player_names = data['selected_player_names'];
        console.log(data);
    });
});