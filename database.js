var mongo = require('mongoskin');
var crypto = require('crypto');

function sanatize(str) {
    if (str == null) {
        return null;
    }
    str = str.replace(/^\s+|\s+$/g, '');
    if (str.length < 1)  {
        return null;
    }
    return str;
}

function randomString(len, callback) {
    crypto.pseudoRandomBytes(len, function(ex, buf) {
        if (ex)
            callback(ex);
        else
            callback(null, buf.toString('hex'));
    });
}

function queryGameByPlayer(params) {    
    var gameid = sanatize(params.gameid);
    var playerid = sanatize(params.playerid);
    if (gameid = null || playerid == null)
        return { 'gameid': 'does-not-exist' };
    return { 'id': gameid, 'players': { $elemMatch: { '.': playerid } } };    
}


function createEvent(playerid, type, arg) {
    return { 
        'player': playerid, 
        'type': type, 
        'arg': arg || {},
        'timestamp': new Date().toJSON()
    };
}

function logQuery(log, err, result){
    if (result && log)
        log.debug(result);
}

function Game(opts) {
    opts = opts || {};
    var url = opts.dbUrl || 'mongodb://anr-web-app:anr-data@troup.mongohq.com:10067/anr-web';
    
    this._db = mongo.db(url);
    this._games = this._db.collection('games');
    this._log = opts.log;
}

module.exports = Game;


Game.prototype.getGames = function(params, callback) {
    var self = this;
    
    var d = new Date();
    d.setHours(new Date().getHours() - 48);
    var yesterday = d.toJSON();
    
    self._games.aggregate(
        { $match: { 'ended': null, 'created': { $gt: yesterday } } },
        { $sort: { 'created': -1 } },
        { $project: { '_id': 0, 'id': 1, 'name': 1, 'players': 1, 'protected': { $cond: [{ $eq: ['$password', null] }, false, true] } } },
        function (err, result) {
            logQuery(self._log, err, result);
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
        });
}

Game.prototype.createGame = function(params, callback) {
    var self = this;
    
    randomString(8, function(err, str) {
        if (err) {
            callback(err);
            return;
        }
        
        var gameid = str;
        var name = sanatize(params.name);
        var password = sanatize(params.password);
        var now = new Date().toJSON();
        var game = { 
            'id': gameid, 
            'created': now,
            'ended': null, 
            'name': name, 
            'password': password,   
            'players': [], 
            'events': [] ,
            'version': 0
        };
        
        self._games.insert(game, function(err, result) {
            logQuery(self._log, err, { 'inserted': result });
            if (err) {
                callback(err);
            }
            else {
                callback(null, { 'gameid': gameid });
            }
        });
    });
}

 Game.prototype.getGame = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    
    self._games.findOne({ 'id': gameid }, { 'events': 0 }, function(err, result) {
        logQuery(self._log, err, result);
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
}

Game.prototype.updateGame = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    var now = new Date().toJSON();
    
    self._games.update( { 'id': gameid }, { $set: { 'ended': now } }, function(err, result) {
        logQuery(self._log, err, { 'updated': result });
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
}

Game.prototype.deleteGame = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    
    self._games.remove({ 'id': gameid }, function(err, result) {
        logQuery(self._log, err, { 'deleted': result });
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
}



Game.prototype.createPlayer = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    var password = sanatize(params.password);
    var name = sanatize(params.name);
    var type = sanatize(params.player) || 's';
    var deck = params.deck || [];
    
    randomString(8, function(err, str) {
        if (err) {
            callback(err);
            return;
        }
        
        var playerid = str;
        var event = createEvent(playerid, 'game.player.join', { 'name': name, 'type': type, 'deck': deck });
        self._games.update(
            { 'id': gameid, 'password': password }, 
            {  $push: { 'players': playerid, 'events': event }, $inc: { version: 1 } },
            function(err, result) {
                logQuery(self._log, err, { 'updated': result });
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, { 'playerid': playerid });
                }
        });
    });
}

Game.prototype.deletePlayer = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    var playerid = sanatize(params.playerid);
    
    var event = createEvent(playerid, 'game.player.leave');
    self._games.update(
        { 'id': gameid, 'players': { $elemMatch: { '.': playerid } } }, 
        {  $pull: { 'players': playerid }, $push: { 'events': event }, $inc: { version: 1 } },
        function(err, result) {
            logQuery(self._log, err, { 'updated': result });
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
    });
}




Game.prototype.createEvent = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    var playerid = sanatize(params.playerid);
    var type = sanatize(request.parameters.type);
    var arg = content.event;    
    var event = createEvent(playerid, type, arg);
    
    self._games.update(
        { 'id': gameid, 'players': { $elemMatch: { '.': playerid } } },
        { '$push': { events: event }, '$inc': { version: 1 } },
        function(err, result) {
            logQuery(self._log, err, { 'updated': result });
            if (err) {
                callback(err);
            }
            else {
                self.getEvents(params, callback);
            }
        });
}

Game.prototype.getEvents = function(params, callback) {
    var self = this;
    var gameid = sanatize(params.gameid);
    var version = parseInt(params.version) || 0;
    
    self._games.findOne(
        { 'id': gameid }, 
        { 'events': { '$slice' : [ version, 50 ] }, 'version' : 1 }, 
        function(err, result) {
            logQuery(self._log, err, result);
            if (err) {
                callback(err);
            }
            else {
                var events = [];
                var slice = result.events || [];
                var count = slice.length;
                for (var i = 0; i < count; i++) {
                    events.push(slice[i]);
                }
                version += count;
                callback(null, { 'version': version, 'events': events, 'remaining': result.version - version });
            }
        });
}
