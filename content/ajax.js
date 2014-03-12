
var netrunner = function (gameid, playerid) {
    this.game = {
        "id": gameid, 
        "playerid": playerid,
        "version": 0
     };
     
     this.init = function(g) {
        var me = this;
        $("#chat-log-input").on("keypress", function(e) {
            if (e.which == 13) {
                me.saveEvent("anr.chat", $(this).val());
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
            case "anr.error":
                break;
            case "anr.chat":
                $("#chat-log").append("<li>" + this.getPlayerName(e.player) + ": " + e.arg + "</li>");
                break;
            case "anr.drawcard":
                break;
            default:
                renderError("Unknown event received: " + JSON.stringify(e));
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
    var me = this;
    var url = "/api/game/" + this.game.id;
    $.ajax(url, {
        dataType: "json",
        success: function(data, status, xhr) {
            $.extend(me.game, data);
            me.game.events = me.game.events || [];            
            me.init(me.game);
            me.renderGame(me.game);
            for(var i = 0; i < me.game.events.length; i++) {
                me.processEvent(me.game.events[i]);
            }
            me.getNewEvents();
        },
        error: function(xhr, status, error) {
            me.renderError(errror);
        }
    });
}

netrunner.prototype.getNewEvents = function() {
    var me = this;
    var version = this.game.version;
    var url = "api/events/" + this.game.id + "/" + this.game.version;
    $.ajax(url, {
        dataType: "json",
        success: function(data, status, xhr) {
            me.processEventData(data);
            setTimeout(function() { me.getNewEvents(); }, 10000);
        },
        error: function(xhr, status, error) {
            me.processEvent({ "type": "anr.error",  "arg": error });
            setTimeout(function() { me.getNewEvents(); }, 60000);
        }
     });
}

netrunner.prototype.saveEvent = function(type, arg) {
    var me = this;
    var url = "api/events/" + this.game.id;
    var data = { "version": this.game.version, "event": { "player": this.game.playerid, "type": type, "arg": arg } };
    $.ajax(url, {
        type: "post",
        dataType: "json",
        data: data,
        success: function(data, status, xhr) {
            me.processEventData(data);
        },
        error: function(xhr, status, error) {
            me.processEvent({ "type": "anr.error",  "arg": error });
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