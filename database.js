function createGame(request, content, callback) {
    require('crypto').randomBytes(8, function(ex, buf) {
        var gameid = buf.toString('hex');
        module._games.insert({ id: gameid, players: [], events: [] }, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, {'gameid': gameid});
            }
        });
    });
}

function getGame(request, content, callback) {
    var gameid = request.parameters.gameid;
    module._games.findOne({ id: gameid }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
}

function joinGame(request, content, callback) {
    var gameid = request.parameters.gameid;
    var player = request.parameters.player || 's';
}

function saveGameEvent(request, content, callback) {
    var event = content.event;
    var gameid = request.parameters.gameid;
    var version = content.version;
    module._games.update(
        { id: gameid }, 
        {'$push': { events: event }},
        function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                getGameEventsSince({ parameters: { gameid: gameid, version: version } }, null, callback);
            }
        });
}

function getGameEventsSince(request, content, callback) {
    var gameid = request.parameters.gameid;
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
            callback(null, { version: count, events: events });
        }
    });
}

module._db = require('mongoskin').db('mongodb://anr-web-app:anr-data@troup.mongohq.com:10067/anr-web');
module._games = module._db.collection('games');

module.exports.createGame = createGame;
module.exports.joinGame = joinGame;
module.exports.getGame = getGame;
module.exports.saveGameEvent = saveGameEvent;
module.exports.getGameEventsSince = getGameEventsSince;
