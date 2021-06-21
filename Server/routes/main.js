/*
    Team7 server js - main | Update: 2021/06/20
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
const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
const router = express.Router();
const fs = require('fs');
const CRYP = require('./cryp.js').CRYP;
const get_key = require('./cryp.js').get_key;

var key_timeout = 7777; // ms

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
    .get('/', (req, res) => { // トップページ
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

    .get('/main', // メインページ
        isAuthenticated,
        (req, res) => {
            switch(req.query.p) {
                case 'course': // /main?p=course
                    res.render('course', {
                        title: 'Team7 - コース',
                        lecture_table: lecture_table,
                        user_id: lecture_json.user_id,
                        top_bar_link: '/main/logout',
                        top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                        dashboard_menu_class: ["dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li"]
                    });
                    break;
                case 'edit': // /main?p=edit
                    res.render('edit', {
                        title: 'Team7 - 編集',
                        lecture_table: lecture_table,
                        user_id: lecture_json.user_id,
                        top_bar_link: '/main/logout',
                        top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                        dashboard_menu_class: ["dash_li", "dash_li", "dash_li dash_li_main", "dash_li", "dash_li"]
                    });
                    break;
                case 'stat': // /main?p=stat
                    res.render('stat', {
                        title: 'Team7 - 統計',
                        lecture_table: lecture_table,
                        user_id: lecture_json.user_id,
                        top_bar_link: '/main/logout',
                        top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                        dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li dash_li_main", "dash_li"]
                    });
                    break;
                case 'dev': // /main?p=dev
                    var user_list = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
                    // console.log(req.user);
                    res.render('dev', {
                        title: 'Team7 - 開発者向け',
                        lecture_table: lecture_table,
                        user_id: lecture_json.user_id,
                        top_bar_link: '/main/logout',
                        top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                        dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li", "dash_li dash_li_main"],
                        webapi_key: get_key(user_list[req.user])
                    });
                    break;
                default: // default (main?p=home)
                    res.render('home', {
                        title: 'Team7 - マイページ',
                        lecture_table: lecture_table,
                        user_id: lecture_json.user_id,
                        top_bar_link: '/main/logout',
                        top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                        dashboard_menu_class: ["dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li"]
                    });
                    break;
            }
    })
    .get('/main/logout', (req, res) => { // ログアウト処理
        req.logout();
        res.redirect('/');
    })
    .get('/main/login', (req, res, next) => { // ログイン処理
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
        +'</td><td>'+'' // なにか
        +'</td><td id="td_dl"> <i class="fas fa-file-csv"></i>csv <i class="fas fa-file-excel"></i>xlsx'
        +'</td></tr>'; // end
    }
    // table += '</td><td></td><td></td><td></td><td></td><td></td></tr>';
    table += '</td><td>一括保存</td><td></td><td></td><td></td><td></td><td id="td_dl"><i class="fas fa-file-download"></i>csv <i class="fas fa-file-download"></i>xlsx</td></tr>';
    return table;
}
var lecture_json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
var lecture_table = createTable(lecture_json);

// ----- ユーザ確認 -----
function check_user(user, pass) {
    var user_list = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
    return (user === user_list[user].username && pass === user_list[user].password);
    // return (user === userB.username);
}

// -----

module.exports = router;
