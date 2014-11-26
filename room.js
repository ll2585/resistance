function Room(name, type){
    this.players = [];
    this.tables = {};
    this.name = name;
    this.gameType = type;
}

Room.prototype.addPlayer = function(player) {
    this.players.push(player);
};

Room.prototype.addTable = function(table) {
    this.tables[table.id] = table;
};

Room.prototype.getTable = function(id) {
    return this.tables[id];
};

Room.prototype.getGameType = function() {
    return this.gameType;
};

Room.prototype.hasTable = function(id) {
    return this.tables[id] != null;
};


module.exports = exports = Room;