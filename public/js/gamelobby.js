var socket = io('/avalon');
var good_roles = ['Merlin', 'Percival', 'Good_Lancelot'];
var bad_roles = ['Mordred', 'Oberon', 'Morgana', 'Bad_Lancelot'];

$(document).ready(function() {
    //tells the server we joined to connect to lobby
    socket.emit("joined_lobby");
    function add_role_html(role, image){
        var html = '<img value="' + role + '" src="' + image + '" width="67" height="100">';
        return html;
    }

    function add_game(data){
        function player_html(i){
            if(i < data['players'].length){
                var html = '<td>' + data['players'][i]['name'] + '</td>';
                return html;
            }
            return '<td></td>';
        }
        function role_html(role){
            var roles = data['roles'][role];
            var html = '';
            for(var role in roles){
                html += '<td id = "' + role + '_' + data['game_id'] + '_cell">';
                if(roles[role]['enabled']){
                    var role_image = roles[role]['image'];
                    html += add_role_html(roles, role_image);
                }
                html += '</td>';
            }
            return html;
        }
        //can make this a role later
        function item_html(role){
            var html = '';
            return html;
        }
        var num_players = data['players'].length;
        var table_html =  '<table class="table table-bordered" id = ' + data['game_id'] + '>';
        for(var i = 0; i < Math.max(num_players,3); i++){
            table_html += '<tr>' + player_html(i);
            console.log(data);
            if(i==0){
                table_html += role_html('good_roles');
            }else if(i==1){
                table_html += role_html('bad_roles');
            }else if (i==2){
                table_html += role_html('items');
            }
            table_html += '</tr>';
        }
        table_html += '<tr><td colspan = "5"><form action="/join" method="post"><input type="hidden" name="game_id" value="' + data['game_id'] + '"><button type="submit">Join</button></form></td></tr></table>';
        $('#tables').append(table_html);
    }

    function add_role(data){
        var game_id = data['game_id'];
        var role = data['role'];
        var image = data['image'];
        var role_html = add_role_html(role, image);
        console.log(role_html);
        $('#' + role + '_'+ game_id + '_cell').append(add_role_html(role, image));
    }
    function remove_role(data){
        var game_id = data['game_id'];
        var role = data['role'];
        $('#' + role + '_' + game_id + '_cell').empty();
    }
    socket.on("removed_role", function(data){
        remove_role(data);
    });
    socket.on("added_role", function(data){
        add_role(data);
    });
    socket.on("new_game_started_lobby", function(data){
        add_game(data);
    });
});