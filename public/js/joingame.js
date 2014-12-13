var socket = io('/avalon');

function get_game_id (){
    var game_id_elem = $('#game_id');
    return game_id_elem.html();
}
function is_on (elem){
    return (!elem.hasClass("not_selected_role"));
}
function turn_on (elem){
    if(!is_on(elem)) {
        elem.removeClass("not_selected_role");
    }
}
function turn_off (elem){
    if(is_on(elem)) {
        elem.addClass("not_selected_role");
    }
}
function add_player (player_data){
    var player_id = player_data['id'];
    var player_name = player_data['name'];
    var html = '<tr id="player_id_' + player_id + '"><td>' + player_name + '</td><td id = "' + player_id + '_status">Not Ready</td></tr>';
    $('.players').append(html);
}
function toggle_ready (player_id){
    var ready_elem = $("#" + player_id + "_status");
    var ready_html = ready_elem.html();
    console.log(ready_html);
    if(ready_html == 'Not Ready'){
        ready_elem.html('Ready!');
    }else{
        ready_elem.html('Not Ready');
    }
}
$(document).ready(function() {
    //tells the server we joined to connect to rooms
    var player_id = $('.playerID').attr('id');
    var player_name = $('.playerID').html();
    console.log('my id is ' + player_id + ' and my name is ' + player_name);
    socket.emit("joined", {game_id: get_game_id(), player: {id: player_id, name: player_name}});

    socket.on("added_role", function(data){
        var elem = $('#' + data['role']);
        turn_on(elem);
    });

    socket.on("removed_role", function(data){
        var elem = $('#' + data['role']);
        turn_off(elem);
    });

    socket.on("player_joined", function(data){
        add_player(data['player']);
    });

    socket.on("player_toggled_ready", function(player_id){
        toggle_ready(player_id);
    });

    socket.on("game_started", function(game_id){
        var redirect_form = $('<form action="/mplay" method="post">' +
        '<input type="hidden" name="game_id" value="' + game_id + '" />' +
        '<input type="hidden" name="player_name" value="' + player_name + '" />' +
        '<input type="hidden" name="player_id" value="' + player_id + '" />' +
        '</form>');
        $('body').append(redirect_form);
        redirect_form.submit();
    });

    var ready_button = $('#ready');

    ready_button.click(function(){
        toggle_ready(player_id);
        socket.emit("toggle_ready", {game_id: get_game_id(), player_id: player_id});
    });

});