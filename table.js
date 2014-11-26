function Table(tableID){
    this.id = tableID;
    this.status = "available";
    this.players = {};
    this.pack = [];
    this.cardOnTable = [];
    this.playerLimit = 2;
    this.gameObj = null;
    this.messages = [];
    this.minPlayers = 2;
    this.maxPlayers = 2;

}


Table.prototype.setName = function(name) {
    this.name = name;
};

Table.prototype.addPlayer = function(player) {
    this.players[player.id] = player;
};

Table.prototype.getPlayer = function(id) {
    return this.players[id];
};

Table.prototype.getGame = function() {
    return this.gameObj;
};

Table.prototype.hasPlayer = function(id) {
    return this.players[id] != null;
};

Table.prototype.addMessage = function(msg) {
    this.messages.push(msg);
};

Table.prototype.addMessages = function(msgs) {
    this.messages = this.messages.concat(msgs);
};

Table.prototype.gameStarted = function() {
    return this.gameObj != null;
};

Table.prototype.getMessages = function() {
    return this.messages;
};

Table.prototype.minPlayersJoined = function() {
    return this.minPlayers < this.numPlayers() < this.maxPlayers;
};


Table.prototype.getGameState = function() {
    var scores = this.getGameScores();
    var gameState = {};
    var state = this.gameObj.gameState();
    gameState['gameStarted'] = false;
    gameState['scores'] = scores;
    gameState['state'] = state;
    console.log(gameState);
    return gameState;
};

Table.prototype.removeFromTable = function(id) {
    delete this.players[id];
};

Table.prototype.playerReady = function(id) {
    return this.players[id].isReady();
};

Table.prototype.numPlayers = function() {
    return Object.keys(this.players).length;
};

Table.prototype.getPlayers = function() {
    return this.players;
};

Table.prototype.getCurPlayer = function() {
    return this.gameObj.getCurPlayer();
};

Table.prototype.everyoneReady = function(id) {
    for(var player in this.players){
        if(!this.players[player].isReady()) {
            console.log("player " + player + " is not ready!");
            return false;
        }
    }
    return true;
};


Table.prototype.getGameScores = function() {
    if(!this.gameStarted()){
        var gameScores = []
        for(var player in this.players){
            gameScores.push({'id': this.players[player].getID(), 'name': this.players[player].getName(), 'score': this.players[player].getReadyStatus()});
        }
        return gameScores;
    }else{
        return this.gameObj.getScoreArray();
    }
};

Table.prototype.newGame = function(g) {
    this.gameObj = g;
    this.gameObj.start();
};

Table.prototype.resetGame = function() {
    this.gameObj = null;
    for(var player in this.players){
        this.players[player].resetPlayer();
    }
};


module.exports = exports = Table;