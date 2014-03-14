
function listGames(request, content, callback) {
    console.log("->listGames");
    logRequest(request, content);
    var d = new Date();
    d.setHours(new Date().getHours() - 48);
    var yesterday = d.toJSON();
    _games.aggregate(
        { $match: { 'ended': null, 'created': { $gt: yesterday } } },
        { $sort: { 'created': -1 } },
        { $project: { '_id': 0, 'id': 1, 'name': 1, 'players': 1, 'protected': { $cond: [{ $eq: ['$password', null] }, false, true] } } },
        function (err, result) {
            logQuery(err, result);
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
            console.log("<-listGames");
        });
}

function createGame(request, content, callback) {
    console.log("->createGame");
    logRequest(request, content);
    _random.randomString(8, function(err, str) {
        if (err) {
            callback(err);
            return;
        }
        
        var gameid = str;
        var name = sanatize(content.name);
        var password = sanatize(content.password);
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
        _games.insert(game, function(err, result) {
            logQuery(err, result);
            if (err) {
                callback(err);
            }
            else {
                callback(null, { 'gameid': gameid });
            }
            console.log("<-createGame");
        });
    });
}

function joinGame(request, content, callback) {
    console.log("->joinGame");
    logRequest(request, content);
    var gameid = request.parameters.gameid;
    var password = sanatize(content.password);
    var name = sanatize(content.name);
    var type = sanatize(content.player) || 's';
    var deck = content.deck || [];
    _random.randomString(8, function(err, str) {
        if (err) {
            callback(err);
            return;
        }
        
        var playerid = str;
        var event = createEvent(playerid, 'game.player.join', { 'name': name, 'type': type, 'deck': deck });
        _games.update(
            { 'id': gameid, 'password': password }, 
            { 
              '$push': { 'players': playerid, 'events': event },
              '$inc': { version: 1 }
            },
            function(err, result) {
                logQuery(err, result);
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, { 'playerid': playerid });
                }
                console.log("<-joinGame");
        });
    });
}

function getGame(request, content, callback) {
    console.log("->getGame");
    logRequest(request, content);
    var query = queryGameByPlayer(request);
    _games.findOne({ 'id': gameid }, { 'events': 0 }, function(err, result) {
        logQuery(err, result);
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
        console.log("<-getGame");
    });
}

function endGame(request, content, callback) {
    console.log("->endGame");
    logRequest(request, content);
    var query = queryGameByPlayer(request);
    var now = new Date().toJSON();
    _games.update(query, { '$set': { 'ended': now } }, function(err, result) {
        logQuery(err, result);
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
        console.log("<-endGame");
    });
}

function deleteGame(request, content, callback) {
    console.log("->deleteGame");
    logRequest(request, content);
    var query = queryGameByPlayer(request);
    _games.remove(query, function(err, result) {
        logQuery(err, result);
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
        console.log("<-deleteGame");
    });
}



function saveGameEvent(request, content, callback) {
    console.log("->saveGameEvent");
    logRequest(request, content);
    
    var query = queryGameByPlayer(request);
    var playerid = sanatize(request.parameters.playerid);
    var type = sanatize(request.parameters.type);
    var arg = content.event;
    var event = createEvent(playerid, type, arg);
    _games.update(
        query, 
        {'$push': { events: event }, '$inc': { version: 1 }},
        function(err, result) {
            logQuery(err, result);
            if (err) {
                callback(err);
            }
            else {
                getGameEventsSince(request, null, callback);
            }
            console.log("<-saveGameEvent");
        });
}

function getGameEventsSince(request, content, callback) {
    console.log("->getGameEventsSince");
    logRequest(request, content);
    var query = queryGameByPlayer(request);
    var version = parseInt(request.parameters.version) || 0;
    _games.findOne(query, { 'events': { '$slice' : [ version, 50 ] }, 'version' : 1 }, function(err, result) {
        logQuery(err, result);
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
        console.log("<-getGameEventsSince");
    });
}

function queryGameByPlayer(request) {    
    var gameid = sanatize(request.parameters.gameid);
    var playerid = sanatize(request.parameters.playerid);
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

function logRequest(request, content){
    //console.log("  request: params - " + JSON.stringify(request.parameters) + "  content - " + JSON.stringify(content));
}

function logQuery(err, result){
    if (err)
        console.log("  query: error - " + JSON.stringify(err));
    //if (result)
    //    console.log("  query: result - " + JSON.stringify(result));
}

function sanatize(str) {
    if (str == null) return null;
    str = str.replace(/^\s+|\s+$/g, '');
    if (str.length < 1) return null;
    return str;
}

var _random = require('./random.js');
var _db = require('mongoskin').db('mongodb://anr-web-app:anr-data@troup.mongohq.com:10067/anr-web');
var _games = _db.collection('games');

module.exports.createGame = createGame;
module.exports.deleteGame = deleteGame;
module.exports.endGame = endGame;
module.exports.joinGame = joinGame;
module.exports.listGames = listGames;
module.exports.getGame = getGame;
module.exports.getGameEventsSince = getGameEventsSince;
module.exports.saveGameEvent = saveGameEvent;
