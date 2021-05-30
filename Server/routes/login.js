/*
    Team7 server js - login | Update: 2021/05/29

    Memo:
    https://qiita.com/dojyorin/items/2fd99491f4b459f937a4
    https://http2.try-and-test.net/ecdhe.html
    https://qiita.com/angel_p_57/items/2e3f3f8661de32a0d432
    https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
    https://ameblo.jp/reverse-eg-mal-memo/entry-12580058952.html


-----
    用語

    CSRF: Cross-Site Request Forgeries
    CORS: Cross-Origin Resource Sharing
     XSS: Cross Site Scripting

      iv: 初期化ベクトル (initialization vector)
     key: 暗号鍵 (key)

    暗号化 ⇔ 復号 (復号化ではない)
    パティング: 暗号アルゴリズムによるが、データ長はある値の倍長である必要があるときに余分な追加される
    サイドチャネル攻撃
*/

var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
var CryptoJS = require('crypto-js');
var router = express.Router();
var key_size = 2<<6; // 2<<7=128, key.length=256
var key_timeout = 10*1000; // ms

// Generate key
let key_v_gen = () => crypto.randomBytes(key_size).toString('hex');
// Generate iv
let iv_v_gen = () => crypto.randomBytes(key_size).toString('hex');
// Generating a encryption key
function key_gen() {
    return {
        "iv": iv_v_gen(),
        "key": key_v_gen(),
    }
}

// Decrypt
function decryptoo(data, bank) {
    // var encryptedHexStr = CryptoJS.enc.Hex.parse(data);
    // var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    // var srcs = CryptoJS.enc.Utf8.parse(data);
    // console.log(srcs);
    // var decrypt = CryptoJS.AES.decrypt(srcs, bank.key, {
    var decrypted = CryptoJS.AES.decrypt(data, bank.key, {
        iv: bank.iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    // var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    // return decryptedStr.toString();
    return decrypted.toString(CryptoJS.enc.Utf8);
}
// not use custom iv
function decryptoo2(data, bank) {
    // var dec = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    // var decrypted = CryptoJS.AES.decrypt(dec, bank.key);
    var decrypted = CryptoJS.AES.decrypt(data, bank.key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// Update the encryption key periodically.
var bank = key_gen();
var update_iv = () => {
    bank.iv = iv_v_gen();
    console.log(bank.iv);
    setTimeout(update_iv, key_timeout);
}
update_iv();

// Request
router
    // GET req
    .get('/', function (req, res, next) {
        res.render('login', {
            title: 'Team7 | Login',
            crypto_bank: bank,
        });
    })
    .get('/u', function (req, res) {
        res.send(bank.iv);
    })
    // POST req
    .post('/', function (req, res) {
        if (req.body.team7) {
            try {
                var body = decodeURIComponent(req.body.team7);
                // var body = req.body.team7;
                console.log({'req':body, 'bank':bank});
                var data = decryptoo(body, bank);
                console.log('>> '+data);
                res.send('b');
            } catch (error) {
                console.log(error);
                res.send('d');
            }
        }
    });

// -----

const userB = {
    username: "B",
    password: "GOD"
};

// -----

module.exports = router;
