var http = require("http");
var connect = require("connect");
var rest = require("connect-rest");
var database = require("./database.js");

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
        
    rest.get('/games/list', database.listGames);
    rest.post('/games/create', database.createGame);
    rest.get('/game/:gameid', database.getGame);
    rest.post('/game/:gameid/delete', database.deleteGame);
    rest.post('/game/:gameid/end', database.endGame);
    rest.post('/game/:gameid/join', database.joinGame);
    rest.get('/events/:gameid/?version', database.getGameEventsSince);
    rest.post('/events/:gameid', database.saveGameEvent);
    
    http.createServer(app).listen(8080);
}


function NullLogger(){ }
NullLogger.prototype.info = function() { };
NullLogger.prototype.debug = function() { };
NullLogger.prototype.error = function() { };

run();