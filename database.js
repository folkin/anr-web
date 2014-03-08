function createGame(request, content, callback) {
    console.log("->createGame");
    module._crypto.randomBytes(8, function(ex, buf) {
        var gameid = buf.toString('hex');
        var name = content.name;
        var password = content.password;
        var now = new Date().toJSON();
        var game = { 
            'id': gameid, 
            'created': now, 
            'name': name, 
            'password': password, 
            'isComplete': false,  
            'players': [], 
            'events': [] 
        };
        module._games.insert(game, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, {'gameid': gameid});
            }
        });
    });
}

function endGame(request, content, callback) {
    console.log("->endGame");
    var gameid = request.parameters.gameid;
    var now = new Date().toJSON();
    module._games.update({ id: gameid }, { '$set': { isComplete: true, completed: now } }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, {'gameid': gameid});
        }
    });
}

function deleteGame(request, content, callback) {
    console.log("->deleteGame");
    var gameid = request.parameters.gameid;
    module._games.remove({ id: gameid }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null);
        }
    });
}

function joinGame(request, content, callback) {
    console.log("->joinGame");
    var gameid = request.parameters.gameid;
    var name = content.name;
    var type = content.player || 's';
    var password = content.password;
    module._crypto.randomBytes(8, function(ex, buf) {
        var playerid = buf.toString('hex');
        module._games.update({ 'id': gameid, 'password': password }, { '$push': { 'players': { 'id': playerid, 'name': name, 'type': type } } }, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, {'playerid': playerid});
            }
        });
    });
}

function getGame(request, content, callback) {
    console.log("->getGame");
    var gameid = request.parameters.gameid;
    module._games.findOne({ 'id': gameid }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
}

function listGames(request, content, callback) {
    console.log("->listGames");
    module._games.aggregate(
        { $match: { isComplete: false } },
        { $sort: { created: -1 } },
        { $project: { '_id': 0, 'id': 1, 'name': 1, 'players': 1, 'protected': { $cond: [{ $eq: ['$password', null] }, false, true] } } },
        function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
        });
}

function saveGameEvent(request, content, callback) {
    console.log("->saveGameEvent");
    var event = content.event;
    var gameid = request.parameters.gameid;
    var version = content.version;
    event.timestamp = new Date().toJSON();
    module._games.update(
        { id: gameid }, 
        {'$push': { events: event }},
        function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                getGameEventsSince({ 'parameters': { 'gameid': gameid, 'version': version } }, null, callback);
            }
        });
}

function getGameEventsSince(request, content, callback) {
    console.log("->getGameEventsSince");
    var version = request.parameters.version || 0;
    getGame(request, content, function(err, result)
    {
        if (err) {
            callback(err);
        }
        else {
            var events = [];
            var allevents = result.events || [];
            var count = allevents.length;
            for (var i = version; i < count; i++) {
                events.push(allevents[i]);
            }
            callback(null, { 'version': count, 'events': events });
        }
    });
}

module._crypto = require("crypto");
module._db = require('mongoskin').db('mongodb://anr-web-app:anr-data@troup.mongohq.com:10067/anr-web');
module._games = module._db.collection('games');

module.exports.createGame = createGame;
module.exports.deleteGame = deleteGame;
module.exports.endGame = endGame;
module.exports.joinGame = joinGame;
module.exports.listGames = listGames;
module.exports.getGame = getGame;
module.exports.getGameEventsSince = getGameEventsSince;
module.exports.saveGameEvent = saveGameEvent;
