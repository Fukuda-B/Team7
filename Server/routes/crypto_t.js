var crypto = require('crypto');
var cipers = crypto.getCiphers();
var hashes = crypto.getHashes();

// Ciphers
for (var i=0; i < cipers.length; i++) { console.log(cipers[i]); }

// Hashes
// for (var i=0; i < hashes.length; i++) { console.log(hashes[i]); }
