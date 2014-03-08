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