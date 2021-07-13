/*
	Team7 server js - main | Update: 2021/06/20
	Our project: https://github.com/Fukuda-B/Team7

	Memo:
	https://qiita.com/dojyorin/items/2fd99491f4b459f937a4
	https://http2.try-and-test.net/ecdhe.html
	https://qiita.com/angel_p_57/items/2e3f3f8661de32a0d432
	https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
	https://ameblo.jp/reverse-eg-mal-memo/entry-12580058952.html
	https://canvasjs.com/

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
const xlsx = require('xlsx');
const csv = require('csv');
const CRYP = require('./cryp.js').CRYP;
const get_key = require('./cryp.js').get_key;
const database = require('./database.js');

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
	async (username, password, done) => {
		var user = CRYP.decryptoo(username, bank),
			// pass = CRYP.decryptoo(password, bank);
			pass = password

		// console.log('--------------------');
		// console.log({
		// 	"user": username,
		// 	"pass": password
		// });
		// console.log({
		// 	"user": user,
		// 	"pass": password
		// });
		// console.log('--------------------');

		if (await database.check_user(user, pass)) {
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
		async (req, res) => {
			var adm = await database.check_user_admin(req.user);
			// console.log(adm);  // admin
			if (adm) { // 管理者の場合
				switch (req.query.p) {
					case 'course': // /main?p=course
						if (req.query.l) { // 講義ごとの詳細表示
							var check_lecture = await database.check_lecture(req.user, req.query.l);
							if (check_lecture) {
                var absence = req.query.absence;
                var lateness = req.query.lateness;
                if (!req.query.absence) absence = 3; // 強調表示の初期値(欠席)
                if (!req.query.lateness) lateness = 5; // 強調表示の初期値(遅刻)
								var lecture_student = await database.create_lec_student_table(req.query.l, absence, lateness);
								res.render('course_more', {
                  absence_v: absence,
                  lateness_v: lateness,
									title: await database.get_lecture_name(req.query.l),
									lecture_table: lecture_student,
									user_id: database.get_user_id(req.user),
									top_bar_link: '/main/logout',
									top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
									dashboard_menu_class: ["dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li"]
								});
							} else {
								res.send('担当していない講義です。');
							}
						} else { // 講義一覧の表示
							var out_table = await database.create_teacher_table(req.user, 'course');
							res.render('course', {
								title: 'Team7 - コース',
								lecture_table: out_table,
								user_id: database.get_user_id(req.user),
								top_bar_link: '/main/logout',
								top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
								dashboard_menu_class: ["dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li"]
							});
						}
						break;
					case 'edit': // /main?p=edit
						if (req.query.l) { // 講義ごとの詳細表示
							var check_lecture = await database.check_lecture(req.user, req.query.l);
							if (check_lecture) {
								var lecture_student = await database.create_lec_student_table(req.query.l, 15, 15);
                var res_list = await database.get_lecture_edit_info(req.query.l);
								res.render('edit_more', {
                  res_list: res_list,
									title: await database.get_lecture_name(req.query.l),
									lecture_table: lecture_student,
									user_id: database.get_user_id(req.user),
									top_bar_link: '/main/logout',
									top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
									dashboard_menu_class: ["dash_li", "dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li"]
								});
							} else {
								res.send('担当していない講義です。');
							}
						} else { // 講義一覧の表示
							var out_table = await database.create_teacher_table(req.user, 'edit');
							res.render('edit', {
								title: 'Team7 - 編集',
								lecture_table: out_table,
								user_id: database.get_user_id(req.user),
								top_bar_link: '/main/logout',
								top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
								dashboard_menu_class: ["dash_li", "dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li"]
							});
						}
						break;
					case 'stat': // /main?p=stat
						res.render('stat', {
							title: 'Team7 - 統計',
							lecture_table: await database.create_teacher_table(req.user, ''),
							lecture_graph_val: get_graph_val(req.user),
							user_id: database.get_user_id(req.user),
							top_bar_link: '/main/logout',
							top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
							dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li dash_li_main", "dash_li", "dash_li"]
						});
						break;
					case 'dev': // /main?p=dev
						res.render('dev', {
							title: 'Team7 - 開発者向け',
							lecture_table: await database.create_teacher_table(req.user, ''),
							user_id: database.get_user_id(req.user),
							top_bar_link: '/main/logout',
							top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
							dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li", "dash_li dash_li_main", "dash_li"],
							webapi_key: await get_key(req.user),
						});
						break;
						case 'setting': // /main?p=setting
						res.render('setting', {
							title: 'Team7 - 個人設定',
							user_id: database.get_user_id(req.user),
							top_bar_link: '/main/logout',
							top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
							dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li", "dash_li", "dash_li dash_li_main"],
							crypto_bank: bank,
						});
						break;
					default: // default (main?p=home)
						var tx = 'home';
						var out_table = await database.create_teacher_table(req.user, tx) +
							'</td><td>一括保存</td><td></td><td></td><td></td><td></td><td></td><td></td>' +
							'<td id="td_dl">' +
							'<a href="/main"><i class="fas fa-file-download"></i>csv</a>' +
							'<a href="/main"><i class="fas fa-file-download"></i>xlsx</a>' +
							'</td></tr>';
						res.render('home', {
							title: 'Team7 - マイページ',
							lecture_table: out_table,
							user_id: database.get_user_id(req.user),
							top_bar_link: '/main/logout',
							top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
							dashboard_menu_class: ["dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li", "dash_li"]
						});
						break;
				}
			} else {
				switch (req.query.p) {
					case 'setting': // /main?p=setting
					res.render('setting_s', {
						title: 'Team7 - 個人設定',
						user_id: database.get_user_id(req.user),
						top_bar_link: '/main/logout',
						top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
						dashboard_menu_class: ["dash_li", "dash_li", "dash_li", "dash_li", "dash_li", "dash_li dash_li_main"],
						crypto_bank: bank,
					});
					break;
				default:
          if (req.query.l) { // 講義ごとの詳細表示
            var check_lecture = await database.check_lecture_major(req.user, req.query.l);
            if (check_lecture) {
              var lecture_student = await database.create_lec_lecture_table(req.user, req.query.l);
              res.render('course_more', {
                title: await database.get_lecture_name(req.query.l),
                lecture_table: lecture_student,
                user_id: database.get_user_id(req.user),
                top_bar_link: '/main/logout',
                top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
                dashboard_menu_class: ["dash_li", "dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li"]
            });
          } else {
              res.send('履修していない講義です。');
            }
        } else {
            var out_table = await database.create_student_table(req.user, 'course');
            res.render('home_s', {
              title: 'Team7 - マイページ',
              lecture_table: out_table,
              user_id: database.get_user_id(req.user),
              top_bar_link: '/main/logout',
              top_bar_text: 'Sign out <i class="fas fa-sign-out-alt"></i>',
              dashboard_menu_class: ["dash_li dash_li_main", "dash_li", "dash_li", "dash_li", "dash_li", "dash_li"]
            });
          }
					break
				}
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
	.post('/update', isAuthenticated, async function(req, res) { // パスワードの更新
		if (req.body.old_pass && req.body.new_pass) {
			var op = decodeURIComponent(req.body.old_pass);
			var np = decodeURIComponent(req.body.new_pass);
			var result = await database.update_pass(req.user, op, np);
			if (result) {
				res.send('ok');
			} else {
				res.send('error');
			}
		} else {
			res.send('error');
		}
	})
	.post('/main/u', function (req, res) { // 認証用 iv
		res.send(bank.iv);
	})
	.post('/main/logout', (req, res) => { // ログアウト処理
		req.logout();
		res.redirect('/');
	})
	.post('/main/login',
		passport.authenticate('local', { // 認証処理
			successRedirect: '',
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

// ----- グラフ出力に必要なデータ生成 -----
function get_graph_val(user) {
	var jsonFile = './routes/user_json.json';
	var lecture_json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
	var json = lecture_json[user];
	var data = new Array();
	for (var i = 0; i < json.lecture.length; i++) {
		data[i] = {
			"label": json.lecture[i].lecture_name,
			"y": json.lecture[i].lecture_cnt
		}
	}
	return data;
}

// ----- xlsxファイル生成 -----
function xlsx_gen(data, fname) {
	var xutil = xlsx.utils;
	(async () => {
		let wb = xutil.book_new();
		let ws = xutil.aoa_to_sheet(data);
		let ws_name = fname;
		xutil.book_append_sheet(wb, ws, ws_name);
		xlsx.writeFile(wb, fname);
		console.log('created: ' + fname);
	})();
}

// ----- csvファイル生成 -----
function csv_gen(data, fname) {
	csv.stringify(data, (error, output) => {
		fs.writeFile(fname, output, (error) => {
			console.log('created: ' + fname);
		})
	})
}

// -----

module.exports = router;