
function randomString(len, callback) {
    _crypto.pseudoRandomBytes(len, function(ex, buf) {
        if (ex)
            callback(ex);
        else
            callback(null, buf.toString('hex'));
    });
}

var _crypto = require('crypto');
module.exports.randomString = randomString;