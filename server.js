var _restify = require('restify');
var _log = require('bunyan');

function run() {

    var log = new _log({
        'name': 'anr-web',
        'stream': process.stdout,
        'level': 'debug'
    });
    
    var server = _restify.createServer({
        'name': 'anr-web',
        'log': log
     });
     
     var Game = require('./database');
     var game = new Game({ log: log });
     
    server.pre(_restify.pre.sanitizePath());
    server.use(_restify.acceptParser(server.acceptable));
    server.use(_restify.queryParser());
    server.use(_restify.bodyParser());
     
    server.get('/api/game', function(req, res, next) { _wrap(req, res, next, game, 'getGames'); });
    server.get('/api/game/:gameid', function(req, res, next) { _wrap(req, res, next, game, 'getGame'); });
    server.post('/api/game', function(req, res, next) { _wrap(req, res, next, game, 'createGame'); });
    server.del('/api/game/:gameid', function(req, res, next) { _wrap(req, res, next, game, 'deleteGame'); });
    server.put('/api/game/:gameid', function(req, res, next) { _wrap(req, res, next, game, 'updateGame'); });
    
    server.post('/api/player', function(req, res, next) { _wrap(req, res, next, game, 'createPlayer'); });
    server.del('/api/player', function(req, res, next) { _wrap(req, res, next, game, 'deletePlayer'); });
    
    server.get('/api/event/:gameid/:version', function(req, res, next) { _wrap(req, res, next, game, 'getEvents'); });
    server.post('/api/event', function(req, res, next) { _wrap(req, res, next, game, 'createEvent'); });
    
    server.get(/\/[^.]+\.[chjmlst]{2,4}/, _restify.serveStatic({
        'directory': './content',
        'default': 'setup.html'
    }));
    
    console.log(server.toString());
    
    server.listen(8000);
}

function _wrap(req, res, next, game, func) {
    req.log.debug({req: { path: req.path(), method: req.method, params: req.params }}, "->" + func);
    game[func](req.params, function (error, result) {
        if (error) {
            req.log.error({err: error}, "<-" + func);
            next(error);
        }
        else {
            res.send(200, result);
            res.log.debug({res: { code: res.code, content: result }}, "<-" + func);
            next();
        }
    });
}

run();