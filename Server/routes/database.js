var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'newuser',
  password : 'new_user_b&!',
  database : 'team7',
});

connection.connect(function(err) { // 接続時のエラー処理
  if (err) {
    console.error('Error: ' + err.stack);
    return;
  }
  console.log('ThreadID: ' + connection.threadId);
});

// ----- クエリ実行 -----
// SQLインジェクション対策 (txはsql文, valはプレースホルダ値)
function db_query(tx, val) {
  return connection.query(tx, val, function (error, results, fields) {
    return results;
  })
}

// ----- ユーザ確認 -----
function check_user(user, pass) {
	try {
		var res_t = db_query('SELECT teacher_id, password_hash FROM team7.teacher_list WHERE teacher_id = ?', user);
		var res_s = db_query('SELECT student_id, password_hash FROM team7.student_list WHERE student_id = ?', user);
    console.log(res_t + res_s);
    if (res_t.length > 0) {
      return (user == res_t.teacher_id && pass == res_t.password_hash);
    } else if (res_s.length > 0)  {
      return (user == res_S.student_id && pass == res_s.password_hash);
    }
	} catch {
		return false;
	}
}

// ----- ユーザが管理者かどうか確認する -----
function check_user_admin(user) {
  try {
		var res_t = db_query('SELECT teacher_id FROM team7.teacher_list WHERE teacher_id = ?', user);
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

exports.db_query = db_query;
exports.check_user = check_user;
exports.check_user_admin = check_user_admin;
exports.get_user_id = get_user_id;
