var http = require("http");
var connect = require("connect");
var rest = require("connect-rest");
var database = require("./database.js");

function run() {
    var options = {
        context: '/api'
    };
    var app = connect()
        .use(connect.static(__dirname + '/content'))
        .use(connect.query())
        .use(connect.urlencoded())
        .use(connect.json({ strict: false }))
        .use(rest.rester(options));
        
    rest.get('/games', database.listGames);
    rest.post('/games', database.createGame);
    rest.get('/games/:gameid', database.getGame);
    rest.post('/game/:gameid/delete', database.deleteGame);
    rest.post('/game/:gameid/end', database.endGame);
    rest.post('/game/:gameid/join', database.joinGame);
    rest.get('/events/:gameid/?version', database.getGameEventsSince);
    rest.post('/events/:gameid', database.saveGameEvent);
    
    http.createServer(app).listen(process.env.PORT, process.env.IP);
}


run();