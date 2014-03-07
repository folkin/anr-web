

var ip = process.env.IP;
var port = process.env.PORT;
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
        .use(connect.json())
        .use(rest.rester(options));
        
    rest.post('/games/create', database.createGame);
    rest.get('/games/:gameid', database.getGame);
    rest.get('/games/:gameid/events/?version', database.getGameEventsSince);
    rest.post('/games/:gameid/events', database.saveGameEvent);
    rest.post('/games/:gameid/players/?player', database.joinGame);
    
    http.createServer(app).listen(process.env.PORT, process.env.IP);
}


run();