//taken from http://bseth99.github.io/projects/rotate/3-circle-align.html
/*
$(function()
{

    var r = 75, cx = 100, cy = 100,
        $circle = $('#unrotated canvas'),
        canvas2 = $circle[0];

    // add some padding
    canvas2.width = cx * 2+50;
    canvas2.height = cy * 2+50;

    var drawGuides = true,
        doAgn = true,
        aOff = 270,
        doOnce = true;

    function position2()
    {

        // Center of the circle relative to the page
        var cpos = $circle.position(); //position instead of offset since bootstrap messes with positioning
        px = cpos.left,
            py = cpos.top;

        var $items = $('#unrotated .items').children(),
            icnt = $items.length,
            dstep = 360 / icnt,
            cpath = PATH([
                {fn: 'start', x: cx+r, y: cy},
                {fn: 'circle', radius: r}
            ]);

        var ctx = canvas2.getContext( "2d" );

        ctx.fillStyle = "white";

        if (!drawGuides)
            ctx.clearRect(0, 0, canvas2.width, canvas2.height);

        $items.each(function (idx, el)
        {
            var $el = $(el),
                a = dstep * idx,
                w = $el.outerWidth(true),
                h = $el.outerHeight(true),
                align = PATH([
                    {fn: 'start',     x: cx-r-w,  y: cy-h},
                    {fn: 'rectangle', w: 2*r+w,   h: 2*r+h, cornerRadius: r}
                ]),
                pt;

            if (doAgn)
                pt = align.step((a + aOff) / 360);
            else
                pt = cpath.step((a + aOff) / 360);

            $el.css({
                left: (px + pt.x) + 'px',
                top: (py + pt.y) + 'px'
            });

        });

        if (drawGuides && doOnce)
        {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2*Math.PI);
            ctx.stroke();
        }

        doOnce = false;
    }

    position2();

});
*/
$(function(){
    function draw_luke_circle(num_players){
        var canvas = document.getElementById('luke_table');
        var context = canvas.getContext('2d');
        //centers the circle
        var radius = 100;
        if($(window).width() < 470){
            radius = 50;
        }

        var padding_x = 25;
        var padding_y = 90;
        canvas.height = radius*2+padding_x;
        canvas.width = radius*2+padding_y;
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;


        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.stroke();
        var angle = 2 * Math.PI / num_players;
        for(var i = 0; i < num_players; i++){
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.lineTo(get_new_x(i, angle, centerX, radius), get_new_y(i, angle, centerY, radius));
            context.stroke();
        }
        return [centerX, centerY, radius];
    }
    function get_new_x(i, angle, centerX, radius){
        return -Math.sin(i * angle)*radius+centerX; //clockwise (remove -1 for counterclockwise)
    }
    function get_new_y(i, angle, centerX, radius){
        return Math.cos(i * angle)*radius+centerX;
    }
    function move_player_label(elem, count, total_players, circle_coords){
        var angle = 2 * Math.PI / num_players;
        var canvas = document.getElementById('luke_table');
        var centerX = $('#luke_circle').width()/2;
        var centerY = $('#luke_circle').height()/2;
        var canvas_offset = $('#luke_table').position();
        var radius = circle_coords[2];
        var label_circle_x = get_new_x(count, angle, centerX, radius);
        var label_circle_y = get_new_y(count, angle, centerY, radius);
        var label_position_x = 0;
        var label_position_y = 0;
        var element_width = $(elem).width(); //40 for the two icons
        var element_height = Math.max($(elem).height()); //20 for the two icons
        if(label_circle_x == centerX){
            label_position_x += centerX - element_width/2;
        }else if(label_circle_x < centerX){
            label_position_x += label_circle_x - element_width;
        }else{
            label_position_x += label_circle_x;
        }
        if(label_circle_y == centerY){
            label_position_y += centerY - element_height/2;
        }else if(label_circle_y < centerY){
            label_position_y += label_circle_y - element_height;
        }else{
            label_position_y += label_circle_y;
        }
        $(elem).css({
            left: label_position_x +'px',
            top: label_position_y+ 'px'
        });
    }
    var player_list = $('#player_list');
    var players = player_list.children('div');
    var num_players = players.length;
    var circle_coords = draw_luke_circle(num_players);
    //first player is the user
    for(var i = 0; i < players.length; i++){
        move_player_label(players[i], i, num_players, circle_coords);
    }
    console.log($(window).height());
});