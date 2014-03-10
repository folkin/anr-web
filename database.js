function createGame(request, content, callback) {
    console.log("->createGame");
    logRequest(request, content);
    module._crypto.randomBytes(8, function(ex, buf) {
        var gameid = buf.toString('hex');
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
            'events': [] 
        };
        module._games.insert(game, function(err, result) {
            logQuery(err, result);
            if (err) {
                callback(err);
            }
            else {
                callback(null, {'gameid': gameid});
            }
            console.log("<-createGame");
        });
    });
}

function endGame(request, content, callback) {
    console.log("->endGame");
    logRequest(request, content);
    var gameid = request.parameters.gameid;
    var now = new Date().toJSON();
    module._games.update({ id: gameid }, { '$set': { 'ended': now } }, function(err, result) {
        logQuery(err, result);
        if (err) {
            callback(err);
        }
        else {
            callback(null, { 'gameid': gameid });
        }
        console.log("<-endGame");
    });
}

function deleteGame(request, content, callback) {
    console.log("->deleteGame");
    logRequest(request, content);
    var gameid = request.parameters.gameid;
    module._games.remove({ id: gameid }, function(err, result) {
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

function joinGame(request, content, callback) {
    console.log("->joinGame");
    logRequest(request, content);
    var gameid = request.parameters.gameid;
    var password = sanatize(content.password);
    var name = sanatize(content.name);
    var type = sanatize(content.player) || 's';
    var deck = content.deck || [];
    module._crypto.randomBytes(8, function(ex, buf) {
        var playerid = buf.toString('hex');
        module._games.update(
            { 'id': gameid, 'password': password }, 
            { '$push': { 'players': { 'id': playerid, 'name': name, 'type': type, 'deck': deck } } }, 
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
    var gameid = request.parameters.gameid;
    module._games.findOne({ 'id': gameid }, function(err, result) {
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

function listGames(request, content, callback) {
    console.log("->listGames");
    logRequest(request, content);
    var d = new Date();
    d.setHours(new Date().getHours() - 48);
    var yesterday = d.toJSON();
    module._games.aggregate(
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

function saveGameEvent(request, content, callback) {
    console.log("->saveGameEvent");
    logRequest(request, content);
    var event = content.event;
    var gameid = request.parameters.gameid;
    var version = content.version;
    event.timestamp = new Date().toJSON();
    module._games.update(
        { id: gameid }, 
        {'$push': { events: event }},
        function(err, result) {
            logQuery(err, result);
            if (err) {
                callback(err);
            }
            else {
                getGameEventsSince({ 'parameters': { 'gameid': gameid, 'version': version } }, null, callback);
            }
            console.log("<-saveGameEvent");
        });
}

function getGameEventsSince(request, content, callback) {
    console.log("->getGameEventsSince");
    logRequest(request, content);
    var version = request.parameters.version || 0;
    getGame(request, content, function(err, result) {
        logQuery(err, result);
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
        console.log("<-getGameEventsSince");
    });
}

function logRequest(request, content){
    console.log("  request: params - " + JSON.stringify(request.parameters) + "  content - " + JSON.stringify(content));
}

function logQuery(err, result){
    if (err)
        console.log("  query: error - " + JSON.stringify(err));
    if (result)
        console.log("  query: result - " + JSON.stringify(result));
}

function sanatize(str) {
    if (str == null) return null;
    str = str.replace(/^\s+|\s+$/g, '');
    if (str.replace(/\s/g, '').length < 1) return null;
    return str;
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
