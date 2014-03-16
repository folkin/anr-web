
var netrunner = function (gameid, playerid) {
    this.game = {
        "id": gameid,
        "version": 0
     };
     this.player = {
        "id": playerid,
     };
     
     this.init = function(g) {
        var self = this;
        $("#chat-log-input").on("keypress", function(e) {
            if (e.which == 13) {
                self.saveEvent("game.chat", $(this).val());
                $(this).val("");
            }
        });
     };

     this.renderError = function(err) {
     };

     this.renderGame = function (g) {
     };
     
     this.processEventData = function(data) {
        this.game.version = data.version;
        for(var i = 0; i < data.events.length; i++) {
            var event = data.events[i];
            this.game.events.push(event);
            this.processEvent(event);
        }
     };
     
     this.processEvent = function(e) {
        switch (e.type) {
            case "game.error":
                break;
            case "game.chat":
                $("#chat-log").append("<li>" + this.getPlayerName(e.player) + ": " + e.arg + "</li>");
                break;
            case "anr.drawcard":
                break;
            default:
                this.renderError("Unknown event received: " + JSON.stringify(e));
        }
        //$("#chat-log").append("<li>" + this.getPlayerName(e.player) + ": " + e.arg + "</li>");
    };
    
    this.getPlayerName = function(playerid) {
        if (playerid) {
            for (var i = 0; i < this.game.players.length; i++) {
                var player = this.game.players[i];
                if (player.id == playerid)
                    return player.name;   
            }
        }
        
        return "--";        
    }
}

netrunner.prototype.loadGame = function() {
    var self = this;
    var url = "/api/game/" + this.game.id;
    $.ajax(url, {
        dataType: "json",
        success: function(data, status, xhr) {
            var version = self.game.version;
            $.extend(self.game, data);
            self.game.events = self.game.events || [];            
            self.init(self.game);
            self.renderGame(self.game);
            self.game.version = version;
            self.getNewEvents();
        },
        error: function(xhr, status, error) {
            self.renderError(error);
        }
    });
}

netrunner.prototype.getNewEvents = function() {
    var self = this;
    var version = this.game.version;
    var url = "api/event/" + this.game.id + "/" + this.game.version;
    $.ajax(url, {
        dataType: "json",
        success: function(data, status, xhr) {
            self.processEventData(data);
            setTimeout(function() { self.getNewEvents(); }, 10000);
        },
        error: function(xhr, status, error) {
            self.processEvent({ "type": "game.error",  "arg": error });
            setTimeout(function() { self.getNewEvents(); }, 60000);
        }
     });
}

netrunner.prototype.saveEvent = function(type, arg) {
    var self = this;
    var url = "api/event/";
    var data = {
        "gameid": this.game.id,
        "playerid": this.player.id,
        "type": type,
        "arg": arg,
        "version": this.game.version
    };
    $.ajax(url, {
        type: "post",
        dataType: "json",
        data: data,
        success: function(data, status, xhr) {
            self.processEventData(data);
        },
        error: function(xhr, status, error) {
            self.processEvent({ "type": "game.error",  "arg": error });
        }
    });
}



// Globals
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}