var mysql      = require('mysql');
// const { connect } = require('./main');


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'newuser',
  password : 'new_user_b&!',
  database : 'team7',
});

// connection.connect(function(err) { // 接続時のエラー処理
//   if (err) {
//     console.error('Error: ' + err.stack);
//     return;
//   }
//   console.log('ThreadID: ' + connection.threadId);
// });

// ----- クエリ実行 -----
// SQLインジェクション対策 (txはsql文, valはプレースホルダ値)
function db_query(tx, val) {
  return new Promise((resolve, reject) => {
    connection.query(tx, val, (err, result, field) => {
      return err ? reject(err) : resolve(result);
    });
  });
}

// ----- ユーザ確認 -----
async function check_user(user, pass) {
	try {
    connection.connect();
		var res_t = await db_query('SELECT teacher_id, password_hash FROM team7.teacher_list WHERE teacher_id = ?', user);
		var res_s = await db_query('SELECT student_id, password_hash FROM team7.student_list WHERE student_id = ?', user);
    connection.end();
    // console.log(res_t + res_s);
    console.log(res_t);
    console.log(res_s);
    if (res_t.length > 0) {
      return (user == res_t[0].teacher_id && pass == res_t[0].password_hash);
    } else if (res_s.length > 0)  {
      console.log(res_s[0].student_id);
      console.log(user);
      return (user == res_s[0].student_id && pass == res_s[0].password_hash);
    }
	} catch {
		return false;
	}
}

// ----- ユーザが管理者かどうか確認する -----
async function check_user_admin(user) {
  try {
		var res_t = await db_query('SELECT teacher_id FROM team7.teacher_list WHERE teacher_id = ?', user);
    console.log(res_t);
    if (res_t.length > 0) return true;
    return false;
  } catch {
    return false;
  }
}

// ----- ユーザ名からUIDを取得する -----
function get_user_id(user) {
  return user;
}

// ----- テスト -----
// (async () => {
//   var ans = await check_user('S001', '$argon2id$v=19$m=10240,t=5,p=2$NGU3ZTc3ZmY0YWIzMGEyZWYyNjNjNjNlOTAzY2U0MDc2YTNiMWZlYjJhZmQ2MDI2NjgyMWM5MjhlNDdkODA4ZDIyNGM1YTMxYjFiOWExZmI0YzM5ZWFjMGFhMTRkMTIwMzFkZGY4MGIxMGU0NDhiODI5NmRlNzVlMjJiMmMxY2UwNDFkNzc4NDQ5ZjJhMWI2MGJiODQyOWVmN2ZkNDBkNDEzOTc1YTZlZGFjNTcwYzA2NThkZmZjMmIzYjU3ZDZlNjI5ODg2MmI1OTk3Y2M5MTdhMWZhZDQ5MGJiMjBhYzg1MzMxYWNjOWQxMDRiOTdmYTQzMmVkZTRjZDM1NTJmY2M2YjFmYjI1OWEzZmQ1NTg4OWVlNGViOGM0NmMyNjJhYTYzNzMzYmUyMmRhZGExMjg5OTUxNGVhY2RlOTk2ZTI1MzUwYTMzNTIyMWU4NGE0Mzg0OTJiMDQ1ZTU0NTMyZDA1YWE5OThiNzliMjkwOTc2OGNkYzAzMTVlMjkzMzA5OWY3NmRkODE1OGUzMzNhN2I3M2Q5YWI0ODE4NDRkZDhlMWEzOTFiYTRiMTdkMjc5NjlkNjNlZGIwMTY1NWRjNDEyNDhmOWUzMTNiNTJhNmNjN2JiOTkyYjc4ZmYxMmE1MGQ2ZjNlNGMyNzM2M2I3ZDkzOWQzNDlhYTQ0YjA4ZDA$MnDSRROuc5IhqMydpw5wwxY8SPG4OKdnsDncgzhqKPqNfnz9OIHOmXR3Vee8+/ijwixH3wmjNTyD1rmCusIUAoJYi9SW9XmRNPGcAi9oDCVz1IHEoBbzT4NdYGcf2qzUVALeXyEYHQysWIq+uc5Yr79lhXbFoN2a/bO0rOvG5G0');
//   console.log(ans);
// })();

exports.db_query = db_query;
exports.check_user = check_user;
exports.check_user_admin = check_user_admin;
exports.get_user_id = get_user_id;
