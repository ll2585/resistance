var socket = io('/avalon');
var good_roles = ['Merlin', 'Percival', 'Good_Lancelot'];
var bad_roles = ['Mordred', 'Oberon', 'Morgana', 'Bad_Lancelot'];
var items = ['Lady_of_the_Lake', 'Excalibur'];
var good_guys_images = {Merlin: 'images/merlin.png', Percival: 'images/percival.png', Good_Lancelot: 'images/goodlancelot.png'};
var bad_guys_images = {Mordred: 'images/mordred.png', Oberon: 'images/oberon.png', Morgana: 'images/morgana.png', Bad_Lancelot: 'images/evillancelot.png'};
var item_images = {Lady_of_the_Lake: 'images/ladyofthelake.png', Excalibur: 'images/excalibur.png'};
var player_ids = [];

function alignment_of_role (role){
    if($.inArray(role, good_roles) > -1){
        return 'Good';
    }else if($.inArray(role, bad_roles) > -1){
        return 'Bad';
    }
}
function image_of_role (role){
    console.log(role);
    if(role in good_guys_images) {
        return good_guys_images[role];
    }else if(role in  bad_guys_images){
        return bad_guys_images[role];
    }else if(role in  item_images){
        return item_images[role];
    }
}
function get_game_id (){
    var game_id_elem = $('#game_id');
    return game_id_elem.html();
}
function toggle (elem){
    if(is_on(elem)){
        turn_off(elem);
    }else{
        turn_on(elem);
    }
}
function is_on (elem){
    return (!elem.hasClass("not_selected_role"));
}
function turn_on (elem){
    if(!is_on(elem)) {
        elem.removeClass("not_selected_role");
        var role = elem.attr('id');
        socket.emit('add_role', {'game_id': get_game_id(), 'role': role, 'image': image_of_role(role)});
    }
}
function turn_off (elem){
    if(is_on(elem)) {
        elem.addClass("not_selected_role");
        var role = elem.attr('id');
        socket.emit('remove_role', {'game_id': get_game_id(), 'role': role, 'image': image_of_role(role)});
    }
}
function add_player (player_data){
    var player_id = player_data['id'];
    var player_name = player_data['name'];
    var html = '<tr id="player_id_' + player_id + '"><td>' + player_name + '</td><td id = "' + player_id + '_status">Not Ready</td></tr>';
    $('.players').append(html);
    player_ids.push(player_id);
}
function remove_player (player_id){
    console.log('removing fucker ' + player_id);
    $("#player_id_" + player_id).remove();
    var index = player_ids.indexOf(player_id);
    if (index > -1) {
        player_ids.splice(index, 1);
    }
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
    if(ready_to_start()){
        enableStartButton();
    } else{
        disableStartButton();
    }
}
function enableStartButton(){
    $("#start").removeAttr("disabled");
    $("#start").show();
}
function disableStartButton(){
    $("#start").prop("disabled", true);
    $("#start").hide();
}
function ready_to_start (){
    console.log(player_ids);
    if(player_ids.length < 5 || player_ids.length > 10){
        return false;
    }
    for(var i = 0; i < player_ids.length; i++){
        var ready_elem = $("#" + player_ids[i] + "_status");
        var ready_html = ready_elem.html();
        if(ready_html == 'Not Ready'){
            return false;
        }
    }
    return true;
}
$(document).ready(function() {
    disableStartButton();
    var player_id = $('.playerID').attr('id');
    player_ids.push(player_id);
    var player_name = $('.playerID').html();
    console.log('my id is ' + player_id + ' and my name is ' + player_name);
    var merlin = $('#Merlin');
    var percival = $('#Percival');
    var good_lancelot = $('#Good_Lancelot');
    var mordred = $('#Mordred');
    var oberon = $('#Oberon');
    var morgana = $('#Morgana');
    var bad_lancelot = $('#Bad_Lancelot');
    var lotl = $('#Lady_of_the_Lake');
    var excal = $('#Excalibur');
    var good_roles = {Merlin: merlin, Percival: percival, Good_Lancelot: good_lancelot};
    var bad_roles = {Mordred: mordred, Oberon: oberon, Morgana: morgana, Bad_Lancelot: bad_lancelot};
    var items = {Lady_of_the_Lake: lotl, Excalibur: excal};
    var game_id = get_game_id();
    var roles = get_roles();

    merlin.click(function(){
        toggle(merlin);
        var co_dependents = [percival, morgana, mordred];
        for(var i = 0; i < co_dependents.length; i++){
            if(is_on(co_dependents[i])){
                turn_off(co_dependents[i]);
            }
        }
    });
    percival.click(function(){
        toggle(percival);
        if(is_on(percival)){
            turn_on(merlin);
        }else{
            if(is_on(morgana)){
                turn_off(morgana);
            }
        }
    });
    bad_lancelot.click(function(){
        toggle(good_lancelot);
        toggle(bad_lancelot);
    });
    good_lancelot.click(function(){
        toggle(good_lancelot);
        toggle(bad_lancelot);
    });
    morgana.click(function(){
        toggle(morgana);
        if(is_on(morgana)){
            turn_on(percival);
            turn_on(merlin);
        }
    });
    mordred.click(function(){
        toggle(mordred);
        if(is_on(mordred)){
            turn_on(merlin);
        }
    });
    oberon.click(function(){
        toggle(oberon);
    });

    lotl.click(function(){
        toggle(lotl);
    });

    excal.click(function(){
        toggle(excal);
    });

    function get_roles (){
        var good_roles_on = {Merlin: false, Percival: false, Good_Lancelot: false};
        var bad_roles_on = {Mordred: false, Oberon: false, Morgana: false, Bad_Lancelot: false};
        var items_on = {Lady_of_the_Lake: false, Excalibur: false};
        for(var role in good_roles_on){
            good_roles_on[role]['enabled'] = is_on(good_roles[role]);
            good_roles_on[role]['image'] = good_guys_images[role];
        }
        for(var role in bad_roles_on){
            bad_roles_on[role]['enabled'] = is_on(bad_roles[role]);
            bad_roles_on[role]['image'] = bad_guys_images[role];
        }
        for(var item in items_on){
            items_on[item]['enabled'] = is_on(items[item]);
            items_on[item]['image'] = item_images[item];
        }
        return {good_roles: good_roles_on, bad_roles: bad_roles_on, items: items_on};
    }

    socket.on("removed_role", function(){
        console.log('removed!!!');
    });

    socket.on("player_joined", function(data){
        add_player(data['player']);
    });

    socket.on("player_left", function(player_id){
        remove_player(player_id);
    });

    socket.on("player_toggled_ready", function(player_id){
        toggle_ready(player_id);
    });

    socket.on("game_started", function(game_id){
        var redirect_form = $('<form action="/play" method="post">' +
        '<input type="hidden" name="game_id" value="' + game_id + '" />' +
        '<input type="hidden" name="player_id" value="' + player_id + '" />' +
        '<input type="hidden" name="player_name" value="' + player_name + '" />' +
        '</form>');
        $('body').append(redirect_form);
        redirect_form.submit();
    });

    socket.emit("new_game_started", {game_id: game_id, roles: roles});
    //tells the server we joined to connect to rooms
    socket.emit("joined", {game_id: get_game_id(), player: {id: player_id, name: player_name}});



    var ready_button = $('#ready');
    ready_button.click(function(){
        toggle_ready(player_id);
        socket.emit("toggle_ready", {game_id: game_id, player_id: player_id});
    });

    var start_button = $('#start');
    start_button.click(function(){

        //error checking that you didnt select more reds than there are reds like you didn't select 3 reds but there's only 2 reds in the game
        socket.emit("start_game", game_id);
    });

    if(ready_to_start()){
        enableStartButton();
    } else{
        disableStartButton();
    }
});