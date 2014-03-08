var http = require("http");
var connect = require("connect");
var rest = require("connect-rest");
var database = require("./database.js");

function run() {
    var options = {
        context: '/api',
        logger: new ConsoleLogger()
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
    
    http.createServer(app).listen(process.env.PORT, process.env.IP);
}


function ConsoleLogger(){ }
ConsoleLogger.prototype.info = function() { };
ConsoleLogger.prototype.debug = function() { };
ConsoleLogger.prototype.error = function() { };

run();