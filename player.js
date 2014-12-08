function Player(id, name){
    this.id = id;
    this.name = name;
    this.status = 'Not Ready';
    //this.status = 'Ready!';
    this.role = 'None';
    this.attributes = {};
}

Player.prototype.set_name = function(name) {
    this.name = name;
};

Player.prototype.get_name = function() {
    return this.name;
};

Player.prototype.set_attributes = function(attribute, val) {
    this.attributes[attribute] = val;
};

Player.prototype.clear_attributes = function(attribute) {
    delete this.attributes[attribute];
};

Player.prototype.get_attribute = function(attribute) {
    if(attribute in this.attributes){
        return this.attributes[attribute];
    }else{
        return null;
    }
};

Player.prototype.toggle_ready = function() {
    if(this.status == 'Not Ready'){
        this.status = 'Ready!';
    }else{
        this.status = 'Not Ready';
    }
};

Player.prototype.set_status = function(status) {
    this.status = status;
};

Player.prototype.get_status = function() {
    return this.status;
};

Player.prototype.set_role = function(role) {
    this.role = role;
};

Player.prototype.get_role = function() {
    return this.role;
};

Player.prototype.public_data = function() {
    return {id: this.id, name : this.name, status: this.status};
};
module.exports = exports = Player;