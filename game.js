var constants = {
  merlin: 'Merlin',
  percival: 'Percival',
  good_lancelot: 'Good_Lancelot',
  mordred: 'Mordred',
  oberon: 'Oberon',
  morgana: 'Morgana',
  bad_lancelot: 'Bad_Lancelot',
  red_count : {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4},
  blue_count : {5: 3, 6: 4, 7: 4, 8: 5, 9: 6, 10: 6},
  mission_1 : {5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3},
  mission_2 : {5: 3, 6: 3, 7: 3, 8: 4, 9: 4, 10: 4},
  mission_3 : {5: 2, 6: 4, 7: 3, 8: 4, 9: 4, 10: 4},
  mission_4 : {5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 5},
  mission_5 : {5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 5},
  vanilla_red : "Vanilla Red",
  assassin : "Assassin",
  vanilla_blue : "Vanilla Blue",
  approve : "Approve",
  reject : "Reject",
  success : "Success",
  fail : "Fail",
  team_propose_state : 1,
  mission_state : 2
}
constants['missions'] = {1: constants['mission_1'], 2: constants['mission_2'], 3: constants['mission_3'], 4: constants['mission_4'], 5: constants['mission_5']};
constants['blue_roles'] = [constants['merlin'], constants['percival'], constants['good_lancelot']];
constants['red_roles'] =  [constants['mordred'], constants['oberon'], constants['morgana'], constants['bad_lancelot']];
function is_red(role){
  return (constants['red_roles'].indexOf(role) > -1 || role == constants['vanilla_red'] || role == constants['assassin']);
}
function Game() {
  this.players = [];
  this.players_id = {};
  this.settings = {Merlin: false, Percival: false, Good_Lancelot: false, Mordred: false, Oberon: false, Morgana: false, Bad_Lancelot: false, Lady_of_the_Lake: false, Excalibur: false};
  this.player_buffer = [];
  this.started = false;
  this.player_count;
  this.two_fails = false;
  this.current_mission;
  this.current_vote;
  this.leader;
  this.proposed_team = [];
  this.votes = {};
  this.mission_result = {};
  this.all_mission_results = {};
  this.red_roles = [];
  this.blue_roles = [];
  this.assigned_roles = {};
  this.player_order = [];
  this.blue_points;
  this.red_points;
  this.state;
  this.historic_votes = {};
}


Game.prototype.add_player = function(player) {
  this.players_id[player.id] = player;
  this.players.push(player);
  console.log('!!!!!!!! ADDDING PLAYTER');
  console.log(this.players);
};

Game.prototype.get_players = function() {
  return this.players;
};

Game.prototype.has_roles = function() {
  for(var i = 0; i < constants['blue_roles'].length; i++){
    if(this.settings[constants['blue_roles'][i]]){
      return true;
    }
  }
  for(var i = 0; i < constants['red_roles'].length; i++){
    if(this.settings[constants['red_roles'][i]]){
      return true;
    }
  }
  return false;
};

Game.prototype.get_player_from_id = function(player_id) {
  return this.players_id[player_id];
};
Game.prototype.get_public_players = function() {
  var players = [];
  for(var i = 0; i <this.players.length; i++){
    players.push(this.players[i].public_data());

  }
  return players;
};
Game.prototype.add_role = function(role) {
  this.settings[role] = true;
};
Game.prototype.remove_role = function(role) {
  this.settings[role] = false;
};
Game.prototype.get_settings = function() {
  return this.settings;
};
Game.prototype.remove_player = function(player_id) {
  console.log('remove fucker ' + player_id);
  delete this.players_id[player_id];
  for(var i = 0; i < this.players.length; i++){
    if (this.players[i].id == player_id){
      console.log('fucker is at ' + i);
      this.players.splice(i, 1);
      break;
    }
  }
  console.log(this.players);
};
Game.prototype.toggle_ready = function(player_id) {
  this.players_id[player_id].toggle_ready();
};

Game.prototype.add_to_buffer = function(player_id) {
  this.player_buffer.push(player_id);
};
Game.prototype.in_game = function(player_id) {
  return player_id in this.players_id;
};
Game.prototype.in_buffer = function(player_id) {
  return this.player_buffer.indexOf(player_id) > -1;
};



Game.prototype.remove_from_buffer = function(player_id) {
  var index = this.player_buffer.indexOf(player_id);
  if (index > -1) {
    this.player_buffer.splice(index, 1);
  }
};

Game.prototype.get_number_of_players = function() {
  return this.player_count;
};
Game.prototype.pass_leadership = function() {
  this.clear_votes();
  console.log("NEW LEADER IS " + this.leader);
  var leader_index = this.player_order.indexOf(this.leader);
  this.leader = this.player_order[(leader_index + 1) % this.player_count]; //makes it 0 if its the last guy
  console.log("LEADER INDEX WAS " + (leader_index + 1));
  this.proposed_team = [];
};

Game.prototype.player_name_exists = function(player_name) {
  for(var i = 0; i < this.players.length; i++){
    var name = this.players[i]['name'];
    if (name == player_name){
      console.log("the plaer name " + player_name + " is " + name);
      return true;
    }
  }
  return false;;
};
Game.prototype.vote_failed = function() {

  this.current_vote += 1;
  this.pass_leadership();

};
Game.prototype.start = function() {
  if(!this.started){
    var all_roles = [];
    this.player_count = this.players.length;
    var num_reds = constants['red_count'][this.player_count];
    var num_blues = constants['blue_count'][this.player_count];
    var reds = [];
    for(var i = 0; i < constants['red_roles'].length; i++){
      if(this.settings[constants['red_roles'][i]]){
        reds.push(constants['red_roles'][i]);
      }
    }
    if(reds.length < num_reds && this.settings['Merlin']){
      reds.push(constants['assassin']);
    }
    while(reds.length < num_reds){
      reds.push(constants['vanilla_red']);
    }
    this.red_roles = reds;


    var blues = [];
    for(var i = 0; i < constants['blue_roles'].length; i++){
      console.log(constants['blue_roles']);
      if(this.settings[constants['blue_roles'][i]]){
        blues.push(constants['blue_roles'][i]);
      }
    }
    while(blues.length < num_blues){
      blues.push(constants['vanilla_blue']);
    }
    this.blue_roles = blues;

    for(var i = 0; i < reds.length; i++){
      all_roles.push(reds[i]);
    }
    for(var i = 0; i < blues.length; i++){
      all_roles.push(blues[i]);
    }
    all_roles = shuffle(all_roles);
    for(player_id in this.players_id){
      this.assigned_roles[player_id] = all_roles.pop();
    }

    //change player order maybe
    for(var i = 0; i < this.players.length; i++){
      this.player_order.push(this.players[i]['id']);
    }
    //leader is first player
    this.leader = this.player_order[0];
    this.current_mission = 1;
    this.blue_points = 0;
    this.red_points = 0;
    this.current_vote = 1;
    this.state = constants['team_propose_state'];
    this.started = true;
  }else{
    console.log('game started already brah');
  }
};
Game.prototype.get_player_role = function(player_id) {
  return this.assigned_roles[player_id];
};
Game.prototype.get_role_information = function(role) {
  var result = '';
  var relevant_players = [];
  if(role == constants['vanilla_blue']){
    result = 'Have Fun!';
  }else if(role == constants['merlin']){
    result = 'The REDS are: <b><ul>'
    var mordred_exists = false;
    for(var player_id in this.players_id){
      if(this.is_spy(player_id) && !(this.assigned_roles[player_id] == constants['mordred'])){
        result += '<li>' + this.players_id[player_id]['name'] + '</li>';
        relevant_players.push(this.players_id[player_id]);
      }
      if(this.assigned_roles[player_id] == constants['mordred']){
        mordred_exists = true;
      }
    }
    result += '</b></ul>';//ok i made this html :x
    if(mordred_exists){
      result += '<br><b>WARNING: MORDRED EXISTS</b>';
    }


  }else if(role == constants['percival']){
    result = 'Merlin is';
    var merlin_name = '';
    var morgana_name = '';
    var morgana_exists = false;
    for(var player_id in this.players_id){
      if(this.assigned_roles[player_id] == constants['merlin']){
        merlin_name = this.players_id[player_id]['name'];
        relevant_players.push(this.players_id[player_id]);
      }
      if(this.assigned_roles[player_id] == constants['morgana']){
        morgana_exists = true;
        morgana_name = this.players_id[player_id]['name'];
        relevant_players.push(this.players_id[player_id]);
      }
    }
    var possible_merlins = [merlin_name];
    if(morgana_exists){
      result += ' between the following two people (the other is <b>MORGANA</b>)';
      possible_merlins.push(morgana_name);
      possible_merlins = shuffle(possible_merlins);
    }

      result += ':<b><ul>';
    for(var i = 0; i < possible_merlins.length; i++){
      result += '<li>' + possible_merlins[i] + '</li>';
    }
    result += '</b></ul>';
  }else if(role == constants['oberon']){
    result = 'Have Fun!';
  }else if(role == constants['bad_lancelot']){
    result = 'Have Fun!';
  }else if(is_red(role)){
    result = 'The REDS are: <b><ul>'
    var bad_lancelot_exists = false;
    var oberon_exists = false;
    for(var player_id in this.players_id){
      if(this.is_spy(player_id) && !(this.assigned_roles[player_id] == constants['oberon']) && !(this.assigned_roles[player_id] == constants['bad_lancelot'])){
        result += '<li>' + this.players_id[player_id]['name'] + '</li>';
        relevant_players.push(this.players_id[player_id]);
      }
      if(this.assigned_roles[player_id] == constants['oberon']){
        oberon_exists = true;
      }
      if(this.assigned_roles[player_id] == constants['bad_lancelot']){
        result += '<li>LANCELOT: ' + this.players_id[player_id]['name'] + '</li>';
        relevant_players.push(this.players_id[player_id]);
      }
    }
    result += '</b></ul>';//ok i made this html :x
    if(oberon_exists || bad_lancelot_exists){
      result += '<br><b>WARNING: ';
      if(oberon_exists){
        result += 'OBERON ';
        if(bad_lancelot_exists){
          result += 'AND ';
        }
      }
      if(bad_lancelot_exists){
        result += 'LANCELOT ';
      }
      result += 'EXIST </b>';
    }
  }
  var data = {html: result, relevant_players: relevant_players};
  return data;
};

Game.prototype.player_is = function(player_id, role) {
  console.log('player id is ' + player_id + ' and the role we want to see is ' + role);
  console.log('the roles are ');
  console.log(this.assigned_roles);
  return this.assigned_roles[player_id] == role;

};


Game.prototype.next_mission = function() {
  if(this.started && this.is_mission_state()){
    this.current_mission += 1;
    this.current_vote = 1;
    this.mission_result = {};
    this.pass_leadership();
    this.state = constants['team_propose_state'];
  }else{
    console.log('game started already brah');
  }
};

Game.prototype.is_spy = function(player_id) {
  return is_red(this.assigned_roles[player_id]);
};


Game.prototype.is_leader = function(player_id) {
  return this.leader == player_id;
};

Game.prototype.player_voted = function(player_id) {
  return player_id in this.votes;
};
Game.prototype.player_submitted = function(player_id) {
  return player_id in this.mission_result;
};


Game.prototype.player_votes = function(player_id, vote) {
  this.votes[player_id] = vote;
  var mission_vote_string = 'mission_' + this.current_mission + '_vote_' + this.current_vote;
  if(!(mission_vote_string in this.historic_votes)){
    this.historic_votes[mission_vote_string] = {};
  }
  this.historic_votes[mission_vote_string][player_id] = vote;
};

Game.prototype.player_submits_mission = function(player_id, submission) {
  this.mission_result[player_id] = submission;
};

Game.prototype.proposal_approved = function() {
  var approves_required = Math.floor(this.player_count / 2) + 1;
  var approves = 0;
  for(var id in this.votes){
    if(this.votes[id] == constants['approve']){
      approves += 1;
    }
  }
   return approves >= approves_required;
};
Game.prototype.is_mission_success = function() {

  var fails_required = 1;
  if(this.need_two_fails()){
    fails_required = 2;
  }
  var fails = 0;
  for(var id in this.mission_result){
    if(this.mission_result[id] == constants['fail']){
      fails += 1;
    }
  }
  return fails < fails_required;
};
Game.prototype.mission_passed = function() {
  this.blue_points += 1;
  this.all_mission_results[this.current_mission] = 1;
};

Game.prototype.did_blue_win = function() {
  return this.blue_points == 3;
};

Game.prototype.has_merlin = function() {
  return this.settings[constants['merlin']];
};

Game.prototype.mission_failed = function() {
  this.red_points += 1;
  this.all_mission_results[this.current_mission] = 0;
};
Game.prototype.get_mission_cards_shuffled = function() {
  var submitted_mission_cards = [];
  for(var id in this.mission_result){
    submitted_mission_cards.push(this.mission_result[id]);
  }
  submitted_mission_cards = shuffle(submitted_mission_cards);
  return submitted_mission_cards;
};
Game.prototype.all_players_voted = function() {
  console.log("num players: " + this.player_count);
  console.log(this.votes);
  var players_voted = Object.keys(this.votes).length;
  return players_voted == this.player_count;
};
Game.prototype.all_human_players_voted = function() {
  console.log("num players: " + this.player_count);
  console.log(this.votes);
  var players_voted = Object.keys(this.votes).length;
  return players_voted == this.get_number_of_human_players();
};
Game.prototype.all_players_submitted = function() {
  //check it two ways, i guess. both should be the same.
  var players_submitted = Object.keys(this.mission_result).length;
  var result = true;
  for(var i = 0; i < this.proposed_team.length; i++){
    if(!(this.proposed_team[i] in this.mission_result)){
      console.log("FUCKER " + i + " DIDNT SUBMIT");
      result = false;
    }
  }
  console.log('PLAYERS SUBMITTED IS ' + players_submitted);
  console.log('RPORPOSED TEAM IS ' + this.proposed_team.length);
  console.log('SO IS THE FIRST PART TRUE? ' + (players_submitted == this.proposed_team.length));
  console.log('AND THE SECOND? ' + result);
  console.log('SO TOTALLY? ' + (players_submitted == this.proposed_team.length && result));
  return (players_submitted == this.proposed_team.length && result);
};

Game.prototype.all_human_players_submitted = function() {
  console.log('wtf humans');
  //check it two ways, i guess. both should be the same.
  var players_submitted = Object.keys(this.mission_result).length;
  var human_players_on_mission = 0;

  var result = true;
  for(var i = 0; i < this.proposed_team.length; i++){
    if(!(this.proposed_team[i] in this.mission_result) && this.players_id[this.proposed_team[i]].get_attribute('bot') == null){
      result = false;
      console.log('oops on thsi fucker');
      console.log(this.proposed_team[i]);
    }
    if(this.players_id[this.proposed_team[i]].get_attribute('bot') == null){
      human_players_on_mission += 1;
    }
  }
  console.log('dumbass humans on this team: ' + human_players_on_mission);
  console.log('idiots that submitted ' + players_submitted);
  return (players_submitted == human_players_on_mission && result);
};
Game.prototype.get_votes = function() {
  var votes = {};
  for(var i = 0; i < this.players.length; i++){
    var name = this.players[i]['name'];
    var id = this.players[i]['id'];
    votes[name] = this.votes[id];
  }
  return votes;
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};
Game.prototype.get_leader = function() {
  return this.leader;
};

Game.prototype.missions_over = function() {
  return this.blue_points == 3 || this.red_points == 3;
};
Game.prototype.get_leader_name = function() {
  return this.players_id[this.leader]['name'];
};
Game.prototype.end_game = function() {
  //SO THIS IS SUPPSOED TO RESTART THE GAME BUT WHATEVER LOL
  //this.started = false;
};
Game.prototype.get_next_player_name_count = function(amt) {
  //FIX THIS
  var result = [];
  var total = 0;
  var player_id = this.player_order[total];
  for (var i = 0; i < this.player_order.length - 1; i++) { //-1 because if it's the last guy, the leader is the first guy which is already set
    if (this.player_order[i] == this.leader) {
      player_id = i;
      while(total < amt) {
        result.push(this.players_id[player_id]['name']);
        amt += 1;
      }
      next_leader = this.player_order[i + 1];
      break;
    }
  }
  return this.players_id[next_leader]['name'];
};
Game.prototype.get_next_player_name = function() {
  var next_leader = this.player_order[0];
  for(var i = 0; i < this.player_order.length -1; i++){ //-1 because if it's the last guy, the leader is the first guy which is already set
    if (this.player_order[i] == this.leader){
      next_leader = this.player_order[i+1];
    }
  }
  return this.players_id[next_leader]['name'];
};
Game.prototype.player_deselected = function(player_id) {
  var index = this.proposed_team.indexOf(player_id);
  if (index > -1) {
    this.proposed_team.splice(index, 1);
  }
  console.log('sunelected ' + player_id);
  console.log(this.proposed_team);
};

Game.prototype.player_selected = function(player_id) {
  console.log('selected ' + player_id);
  console.log(this.proposed_team);
  this.proposed_team.push(player_id);
};

Game.prototype.get_selected_players_names = function() {
  var result = [];
  for(var i = 0; i < this.proposed_team.length; i++){
    result.push(this.players_id[this.proposed_team[i]]['name'])
  }
  return result;
};


Game.prototype.get_selected_players_ids = function() {
  return this.proposed_team;
};
Game.prototype.get_players = function() {
  return this.players;
};
Game.prototype.get_player_ids = function() {
  var players = [];
  for(var id in this.players_id){
    players.push(id); //ids are ints maybe i have to change this later

  }
  return players;
};
Game.prototype.get_non_human_player_ids = function() {
  var players = [];
  for(var id in this.players_id){
    if(this.players_id[id].get_attribute('bot') !== null){
      players.push(id); //ids are ints maybe i have to change this later
    }


  }
  return players;
};

Game.prototype.on_proposal_state = function() {
  this.state = constants['team_propose_state'];
};

Game.prototype.on_mission = function() {
  this.state = constants['mission_state'];
};

Game.prototype.is_mission_state = function() {
  return this.state == constants['mission_state'];
};

Game.prototype.is_propose_state = function() {
  return this.state == constants['team_propose_state'];
};

Game.prototype.clear_votes = function() {
  this.votes = {};
};

Game.prototype.get_current_round = function() {
  var data = {};
  data['round'] = this.current_mission;
  data['vote'] = this.current_vote;
  data['leader'] = this.leader;
  data['proposed_team'] = this.proposed_team;
  data['blue_points'] = this.blue_points;
  data['red_points'] = this.red_points;
  data['num_players'] = this.player_count;
  data['team_size'] = constants['missions'][this.current_mission][this.player_count];
  data['players'] = this.get_public_players();
  data['all_mission_results'] = this.all_mission_results;
  return data;
};
Game.prototype.need_two_fails = function() {
  return this.current_mission == 4 && this.player_count >= 7;
};
Game.prototype.get_last_vote = function() {
  var last_vote = this.current_vote - 1;
  var last_mission = this.current_mission - 1;
  var mission_vote_string = 'mission_' + last_mission + '_vote_' + last_vote;
  if (last_vote == 0){
    for(var i = 1; i < 6; i++){
      var new_mission_string = 'mission_' + last_mission + '_vote_' + i;
      if(!(new_mission_string in this.historic_votes)){
        last_vote = i - 1;
      }
    }
  }else{
    last_mission = this.current_mission;
  }

  return this.historic_votes[mission_vote_string];

};

Game.prototype.player_is_on_mission = function(player_id) {
  return this.proposed_team.indexOf(player_id) > -1;; //ids are ints maybe i have to change this later)
};

Game.prototype.get_number_of_human_players = function() {
  var human_players = 0;
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].get_attribute('bot') == null){
      human_players += 1;
    }
  }
  return human_players;
};

Game.prototype.leader_is_bot = function() {
  var leader_player = this.players_id[this.leader];
  return leader_player.get_attribute('bot') !== null;
};
Game.prototype.player_id_is_bot = function(player_id) {
  var leader_player = this.players_id[player_id];
  return leader_player.get_attribute('bot') !== null;
};
Game.prototype.no_humans_on_team = function() {
  for(var i = 0; i < this.proposed_team.length; i++){
    if(this.players_id[this.proposed_team[i]].get_attribute('bot') == null){
      return false;
    }
  }
  return true;
};
module.exports = exports = Game;

exports.get_constants = function() {
  return constants;
};