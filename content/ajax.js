function listGames(callback, context) {
    $.ajax('api/games', {
        dataType: "json",
        success: function(data, status, xhr) { 
            callback({ 'games': data }, context); 
        },
        error: function(xhr, status, error) {
            callback(error, context);
        }
    });
}

function createGame() {
    var name = $("#new-game-name").val();
    var password = $("#new-game-password").val();
    
    if (!name) {
        $("#new-game-name").closest(".form-group").addClass("has-error");
        return;
    }
    
    $('#new-game-modal').modal('hide');
    
    $.ajax('api/games/create', {
        dataType: "json",
        type: "post",
        data: { "name": name, "password": password },
        success: function(data, status, xhr) { 
            callback({ 'games': data }, context); 
        },
        error: function(xhr, status, error) {
            callback(error, context);
        }
    });
}