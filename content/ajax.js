
var netrunner = function (gameid, playerid) {
    this.game = {
        "id": gameid, 
        "playerid": playerid,
        "version": 0
     }; 

     this.renderError = function(err) {
     };

     this.renderGame = function (g) {
     };
     
     this.processEvent = function(e) {
        switch (e.type) {
            case "anr.error":
                break;
            case "anr.chat":
                break;
            case "anr.drawcard":
                break;
            default:
                renderError("Unknown event received: " + JSON.stringify(e));
        }
     };
}

netrunner.prototype.loadGame = function() {
    var me = this;
    var url = "/api/game/" + this.game.id;
    $.ajax(url, {
        dataType: "json",
        success: function(data, status, xhr) {
            $.extend(me.game, data);
            me.game.events = me.game.events || [];
            me.renderGame(me.game);
            for(i = 0; i < me.game.events.length; i++) {
                me.processEvent(me.game.events[i]);
            }
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
            me.game.version = data.version;
            for(i = 0; i < data.events.length; i++) {
                var event = data[i];
                me.game.events.push(event);
                me.processEvent(event);
            }
            setTimeout(function() { me.getNewEvents(); }, 2000);
        },
        error: function(xhr, status, error) {
            me.processEvent({ "type": "anr.error",  "arg": error });
            setTimeout(function() { me.getNewEvents(); }, 5000);
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