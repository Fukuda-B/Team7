/*
    Team7 server js - main | Update: 2021/06/01
    Our project: https://github.com/Fukuda-B/Team7

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

'use strict'
var express = require('express');
var session = require('express-session');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
var CryptoJS = require('crypto-js');
const { nextTick } = require('process');
var router = express.Router();
var key_size = 2<<7; // 2<<7=2^8=256, key.length=512
var key_timeout = 7777; // ms


var CRYP = {
    // Generate key
    key_v_gen : function() {
        return crypto.randomBytes(key_size).toString('hex');
    },
    // Generate iv
    iv_v_gen : function() {
        return crypto.randomBytes(key_size).toString('hex');
    },
    // Generating a encryption key
    key_gen : function() {
        return {
            "iv": CRYP.iv_v_gen(),
            "key": CRYP.key_v_gen(),
        }
    },
    // Decrypt
    decryptoo : function(data, bank) {
        data = decodeURIComponent(data);
        var decrypted = CryptoJS.AES.decrypt(data, bank.key, {
            iv: bank.iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    },
    // not use custom iv
    decryptoo2 : function(data, bank) {
        var decrypted = CryptoJS.AES.decrypt(data, bank.key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    },
}
// Update the encryption key periodically.
var bank = CRYP.key_gen();
var update_iv = () => {
    bank.iv = CRYP.iv_v_gen();
    setTimeout(update_iv, key_timeout);
}
update_iv();

// Passport
passport.use(new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
    },
    (username, password, done) => {
        var user = CRYP.decryptoo(username, bank),
            pass = CRYP.decryptoo(password, bank);

        console.log('--------------------');
        console.log({"user":username, "pass":password});
        console.log({"user":user, "pass":pass});
        console.log('--------------------');

        if (check_user(user, pass)) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    }
));
router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});


// Request
router
    // GET req
    .get('/',
        isAuthenticated,
        (req, res) => {
        res.render('home', {
            title: 'Team7',
            lecture_table: lecture_table,
            user_id: lecture_json.user_id
        });
    })
    .get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    })
    .get('/login', (req, res, next) => {
            if (req.isAuthenticated()) { // 認証済み
                res.redirect('/main');
            } else {
                next();
            }
        },
        (req, res) => { // 未認証
            res.render('login', {
                title: 'Team7 | Login',
                crypto_bank: bank,
            });
        }
    )

    // POST req
    .post('/u', function (req, res) {
        res.send(bank.iv);
    })
    .post('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    })
    .post('/login',
        passport.authenticate('local', {
            successRedirect : '',
            failureRedirect : 'main/login',
        }),
        (req, res) => {
            res.send('/main');
        }
    );


// ----- 認証済みか確認する関数 -----
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('main/login'); // ログインページへリダイレクト
    }
}

// ----- JSON読み込みテスト -----
var fs = require('fs');
var jsonFile = './routes/user_json.json';
function createTable(json) {
    var table = '';
    for (var tmp of json.lecture) {
        table += '<tr><td>'+tmp.lecture_name
        +'</td><td>'+tmp.lecture_date.f+' '
        +tmp.lecture_date.w+' '
        +tmp.lecture_date.t
        +'</td><td>'+tmp.lecture_teach
        +'</td><td>'+tmp.lecture_par+'%</td></tr>';
    }
    return table;
}
var lecture_json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
var lecture_table = createTable(lecture_json);

// ----- ユーザ確認 -----
function check_user(user, pass) {

    const userB = {
        username: "b",
        password: "god"
    };
    
    return (user === userB.username && pass === userB.password);
}

// -----

module.exports = router;
