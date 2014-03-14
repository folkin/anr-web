var http = require('http');
var connect = require('connect');
var rest = require('connect-rest');
var _database = require('./database.js');
var _random = require('./random.js');

function run() {
    var options = {
        context: '/api',
        logger: new NullLogger()
    };
    var app = connect()
        .use(connect.static(__dirname + '/content'))
        .use(connect.query())
        .use(connect.urlencoded())
        .use(connect.json({ strict: false }))
        .use(connect.logger('dev'))
        .use(rest.rester(options));
        
    rest.get('/games/list', _database.listGames);
    rest.post('/games/create', _database.createGame);
    rest.post('/game/:gameid/join', _database.joinGame);
    rest.get('/game/:gameid/:playerid', _database.getGame);
    rest.post('/game/:gameid/:playerid/end', _database.endGame);
    rest.post('/game/:gameid/:playerid/delete', _database.deleteGame);
    rest.get('/events/:gameid/:playerid/?version', _database.getGameEventsSince);
    rest.post('/events/:gameid/:playerid/:type/?version', _database.saveGameEvent);
    rest.get('/random/?len', random);
    //rest.get('/proxy/:url', _get);
    
    http.createServer(app).listen(8000);
}

function random(request, content, callback) {
    var len = request.parameters.len;
    if (len == null)
        len = "8";
    try {
        length = parseInt(len);
    }
    catch (err)
    {
        callback(err);
    }
    if (length > 1024)
        length = 1024;
    
    _random.randomString(length, callback);
}

//function _get(request, content, callback) {
//    var http = require('http');
//    var $url = require('url').parse(unescape(request.parameters.url));
//
//    console.log('-> GET ' + $url.hostname + ':' + ($url.port || '80') + $url.path);
//    http.request({
//            host: $url.hostname,
//            port: $url.port || '80',
//            path: $url.path
//        },    
//        function(res) {
//            var data = '';
//            res.on('data', function (chunk) {
//                data += chunk;
//            });
//            res.on('error', function(error) {
//                callback(error);
//            });
//            res.on('end', function () {
//                callback(null, data);
//            });
//        }
//    ).end();
//}


function NullLogger(){ }
NullLogger.prototype.info = function() { };
NullLogger.prototype.debug = function() { };
NullLogger.prototype.error = function() { };

run();