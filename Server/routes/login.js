/*
    Team7 server js - login | Update: 2021/05/25

    Memo:
    https://qiita.com/dojyorin/items/2fd99491f4b459f937a4
    https://http2.try-and-test.net/ecdhe.html
*/

var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
var router = express.Router();

/*
    Team7 will use ECDH P-521 for key generation and AES256 for encryption.
    When using multiple algorithms, the cipher strength depends on the one with lower cipher strength.
    In this case, ECDH has a lower strength. (Strength with the same key length: ECDH < AES)
    So, ECDH requires a key length of 512 bits or more to match the 256 bits of AES.

    crypto.subtle.generateKey(algorithm, exportable, usage)
*/
function key_gen() {
    var crypto_v = {
        name: "ECDH",
        namedCurve: "P-521"
    }
    var crypto_u = ["deriverKey"];
    return crypto.subtle.generateKey(crypto_v, false, crypto_u);
}
function decrypto() {
    return
}

router
    // GET req
    .get('/', function(req, res, next) {
        res.render('login', {
            title: 'Team7 | Login',
            crypto_key: key_gen.publickey
        });
    })
    // POST req
    .post('/', function(req, res) {

    });

// -----

const userB = {
    username: "B",
    password: "GOD"
};

// -----

module.exports = router;
