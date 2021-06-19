/*
    Team7 server js - main | Update: 2021/06/15
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
const express = require('express');
const session = require('express-session');
const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { nextTick } = require('process');
const router = express.Router();
const fs = require('fs');

var key_size = 2<<7; // 2<<7=2^8=256, key.length=512
var key_timeout = 7777; // ms


const CRYP = {
    // Generate key
    key_v_gen : function() {
        return crypto.randomBytes(key_size).toString('hex');
    },
    // Generate iv
    iv_v_gen : function() {
        return crypto.randomBytes(key_size).toString('hex');
    },
    // Generating a encryption key
    // salt is only used for argon2 hasing
    key_gen : function() {
        return {
            "iv": CRYP.iv_v_gen(),
            "key": CRYP.key_v_gen(),
            "salt": "4e7e77ff4ab30a2ef263c63e903ce4076a3b1feb2afd60266821c928e47d808d224c5a31b1b9a1fb4c39eac0aa14d12031ddf80b10e448b8296de75e22b2c1ce041d778449f2a1b60bb8429ef7fd40d413975a6edac570c0658dffc2b3b57d6e6298862b5997cc917a1fad490bb20ac85331acc9d104b97fa432ede4cd3552fcc6b1fb259a3fd55889ee4eb8c46c262aa63733be22dada12899514eacde996e25350a335221e84a438492b045e54532d05aa998b79b2909768cdc0315e2933099f76dd8158e333a7b73d9ab481844dd8e1a391ba4b17d27969d63edb01655dc41248f9e313b52a6cc7bb992b78ff12a50d6f3e4c27363b7d939d349aa44b08d0",
        }
    },
    // Decrypt
    decryptoo : function(data, bank) {
        var word = decodeURIComponent(data);
        var encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        var decrypted = CryptoJS.AES.decrypt(srcs, CryptoJS.enc.Utf8.parse(bank.key), {
                iv: CryptoJS.enc.Utf8.parse(bank.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        // console.log({"rec":data, "hex":encryptedHexStr, "pure":srcs, "decrypted":decrypted, "final":decrypted.toString(CryptoJS.enc.Utf8)});
        return decrypted.toString(CryptoJS.enc.Utf8).toString();
    },
    // pure aes decrypt
    decryptoo2 : function(data, bank) {
        var srcs = decodeURIComponent(data);
        var decrypted = CryptoJS.AES.decrypt(srcs, CryptoJS.enc.Utf8.parse(bank.key), {
                iv: CryptoJS.enc.Utf8.parse(bank.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        return decrypted.toString(CryptoJS.enc.Utf8).toString();
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
            // pass = CRYP.decryptoo(password, bank);
            pass = password

        console.log('--------------------');
        console.log({"user":username, "pass":password});
        console.log({"user":user, "pass":password});
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
    .get('/', (req, res) => {
        if (isAuthenticated_bool(req, res)) {
            res.render('index', {
                title: 'Team7',
                top_bar_link: '/main',
                top_bar_text: '<i class="fas fa-user"></i> My Page'
            });
        } else {
            res.render('index', {
                title: 'Team7',
                top_bar_link: '/main',
                top_bar_text: 'Sign in <i class="fas fa-sign-in-alt"></i>'
            });
        }
    })

    .get('/main',
        isAuthenticated,
        (req, res) => {
        // console.log(req.session);
        res.render('home', {
            title: 'Team7',
            lecture_table: lecture_table,
            user_id: lecture_json.user_id,
            top_bar_link: '/main/logout',
            top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>'
        });
    })
    .get('/main/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    })
    .get('/main/login', (req, res, next) => {
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
                top_bar_link: '',
                top_bar_text: ''
            });
        }
    )

    // POST req
    .post('/main/u', function (req, res) { // 認証用 iv
        res.send(bank.iv);
    })
    .post('/main/logout', (req, res) => { // ログアウト処理
        req.logout();
        res.redirect('/');
    })
    .post('/main/login',
        passport.authenticate('local', { // 認証処理
            // successRedirect : '',
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
        res.redirect('/main/login'); // ログインページへリダイレクト
    }
}

// ----- 認証済みか確認する関数 戻り値はbool -----
function isAuthenticated_bool(req, res) {
    return req.isAuthenticated();
}

// ----- JSON読み込みテスト -----
var jsonFile = './routes/user_json.json';
function createTable(json) {
    var table = '';
    for (var tmp of json.lecture) {
        table += '<tr><td>'+tmp.lecture_name
        +'</td><td>'+tmp.lecture_date.f+' '
        +tmp.lecture_date.w+' '
        +tmp.lecture_date.t
        +'</td><td>'+tmp.lecture_teach // 担当
        +'</td><td>'+tmp.lecture_par+'%' // 出席率
        +'</td><td id="td_dl"> <i class="fas fa-file-csv"></i>csv <i class="fas fa-file-excel"></i>xlsx <i class="fas fa-file-image"></i>png'
        +'</td></tr>'; // end
    }
    table += '</td><td></td><td></td><td></td><td></td><td></td></tr>';
    table += '</td><td>一括保存</td><td></td><td></td><td></td><td id="td_dl"><i class="fas fa-file-download"></i>csv <i class="fas fa-file-download"></i>xlsx <i class="fas fa-file-download"></i>png</td></tr>';
    return table;
}
var lecture_json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
var lecture_table = createTable(lecture_json);

// ----- ユーザ確認 -----
function check_user(user, pass) {
    var userB = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
    return (user === userB.username && pass === userB.password);
    // return (user === userB.username);
}

// -----

module.exports = router;
