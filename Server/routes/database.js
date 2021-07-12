var mysql      = require('mysql');
const CRYP = require('./cryp.js').CRYP;


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
  return new Promise((resolve, reject) => {
    connection.query(tx, val, (err, result, field) => {
      return err ? reject(err) : resolve(result);
    });
  });
}

// ----- ユーザ確認 -----
async function check_user(user, pass) {
  try {
		var res_t = await db_query('SELECT teacher_id, password_hash FROM team7.teacher_list WHERE teacher_id = ? LIMIT 1', user);
		var res_s = await db_query('SELECT student_id, password_hash FROM team7.student_list WHERE student_id = ? LIMIT 1', user);
    if (res_t.length > 0) { // 管理者
      return (user == res_t[0].teacher_id && pass == res_t[0].password_hash);
    } else if (res_s.length > 0)  { // 学生用
      return (user == res_s[0].student_id && pass == res_s[0].password_hash);
    }
  } catch {
    return false;
  }
}

// ----- ユーザが管理者かどうか確認する -----
async function check_user_admin(user) {
  try {
		var res_t = await db_query('SELECT teacher_id FROM team7.teacher_list WHERE teacher_id = ? LIMIT 1', user);
    // console.log(res_t);
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

// ----- APIキーの認証 -----
function check_user_api(req) {
  try {
    if (req.query.x) {
      var dec = CRYP.decryptoo(req.query.x, bank_api);
    } else if (req.body.x) {
      var dec = CRYP.decryptoo(req.body.x, bank_api);
    }
    var dec_p = JSON.parse(dec);
    return check_user(dec_p.u, dec_p.p);
  } catch {
    return false;
  }
}

// ----- 管理者のテーブル生成 ----- (user_id, page)
async function create_teacher_table(user, page) {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules WHERE teacher_id = ?', user);
    var table = '';
    var row, exx, tx;
    for (var row of res_list) {
      if (row.exam == 1) exx = 'あり';
      else exx = 'なし';

      switch (page) {
        case 'course':
          tx = '<a href="/main?p=course&l='+row.lecture_id+'">詳細<i class="fas fa-file-alt"></i></a>';
          break;
        case 'edit':
          tx = '<a href="/main?p=edit&l='+row.lecture_id+'">編集<i class="fas fa-pencil-alt"></i></a>';
          break;
        case 'home':
          tx = '<a href="/main"><i class="fas fa-file-csv"></i>csv</a>' +
          '<a href="/main"><i class="fas fa-file-excel"></i>xlsx</a>';
          break;
      }

      table += '<tr><td>' + row.lecture_name + ' ('+ row.lecture_id + ')' +
      '</td><td>' + row.day_of_week +
      '</td><td>' + row.start_time +
      '</td><td>' + row.end_time +
      '</td><td>' + row.attend_limit + '分' +
      '</td><td>' + row.late_limit + '分' +
      '</td><td>' + exx +
			'</td><td id="td_dl"> ' +
      tx + '</td></tr>'; // end
    }
    return table;
  } catch {
    return 'error';
  }
}

// ----- 学生用のテーブル生成 -----
async function create_student_table(user, page) {
  try {
    var res_list = await db_query('SELECT lecture_id FROM team7.student_timetable WHERE student_id = ?', user);
    var table = '';
    var stdl2, row, exx, tx;
    for (var stdl of res_list) {
      stdl2 = await db_query('SELECT * FROM team7.lecture_rules WHERE lecture_id = ?', stdl.lecture_id);
      row = stdl2[0];
      if (row.exam == 1) exx = 'あり';
      else exx = 'なし';

      switch (page) {
        case 'course':
          tx = '<a href="/main?p=course&l='+row.lecture_id+'">詳細<i class="fas fa-file-alt"></i></a>';
          break;
      }
      table += '<tr><td>' + row.lecture_name +
      '</td><td>' + row.day_of_week +
      '</td><td>' + row.start_time +
      '</td><td>' + row.end_time +
      // '</td><td>' + row.attend_limit +
      // '</td><td>' + row.late_limit +
      '</td><td>' + exx +
			'</td><td id="td_dl"> ' +
      tx + '</td></tr>'; // end
    }
    return table;
  } catch {
    return 'error';
  }
}

// ----- ユーザのパスワードハッシュを取得 ----- (user_id)
async function get_pass(user) {
  try {
		var res_t = await db_query('SELECT password_hash FROM team7.teacher_list WHERE teacher_id = ?', user);
		var res_s = await db_query('SELECT password_hash FROM team7.student_list WHERE student_id = ?', user);
    if (res_t.length > 0) {
      return res_t[0].password_hash;
    } else if (res_s.length > 0)  {
      return res_s[0].password_hash;
    }
  } catch {
    return false;
  }
}

// ----- パスワードの更新 ----- (user_id, old_password_hash, new_password_hash)
async function update_pass(user, old_pass, new_pass) {
  try {
		var res_t = await db_query('SELECT teacher_id, password_hash FROM team7.teacher_list WHERE teacher_id = ? LIMIT 1', user);
		var res_s = await db_query('SELECT student_id, password_hash FROM team7.student_list WHERE student_id = ? LIMIT 1', user);
    if (res_t.length > 0) { // 管理者
      if (user == res_t[0].teacher_id && old_pass == res_t[0].password_hash) {
        var data = [new_pass, user, old_pass];
        await db_query('UPDATE team7.teacher_list SET password_hash = ? WHERE teacher_id = ? AND password_hash = ?', data);
        return true;
      }
    } else if (res_s.length > 0)  { // 学生用
      if (user == res_s[0].student_id && old_pass == res_s[0].password_hash) {
        var data = [new_pass, user, old_pass];
        await db_query('UPDATE team7.student_list SET password_hash = ? WHERE student_id = ? AND password_hash = ?', data);
        return true;
      }
    }
    return false; // ユーザが存在しない場合
  } catch {
    return false;
  }
}

// ----- 履修者の出欠リスト取得 ----- (lecture_id)
async function create_lec_student_table(lecture_id) {
  try {
    var week_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id); // 何週目までか
    var weeks = week_val[0].weeks;
    var res_list = await db_query('SELECT student_id FROM team7.student_timetable WHERE lecture_id = ?', lecture_id);
    var std_list = await db_query('SELECT student_id, week, result, datetime FROM team7.attendance WHERE lecture_id = ?', lecture_id);
    var table = '';

    var std_list_arr = {}; // 出欠状況を連想配列として入れておく
    for (var row of std_list) {
      if (!std_list_arr[row.student_id]) std_list_arr[row.student_id] = {};
      std_list_arr[row.student_id][row.week] = 1;
      if (row.week > weeks) weeks = row.week; // 最終週の更新
    }

    // テーブルのヘッダ部分
    table += '<tr><th>履修者ID</th> <th>履修者名</th>';
    for (var i = 0; i < weeks; i++) {
      table += '<th>' + (i+1) + '</th>'; 
    }
    table += '<th>出席回数</th></tr>';

    // テーブルのデータ部分
    var sum = 0; // 合計出席回数を計算するために使う一時的な変数
    for (var row of res_list) {
      table += '<tr><td>' + row.student_id;
      table += '</td><td>' + await get_name(row.student_id);
      sum = 0;
      for (var i = 0; i < weeks; i++) {
        if (std_list_arr[row.student_id][i+1] == 1) {
          sum++;
          table += '</td><td id="td_1">' + '〇';
        } else {
          table += '</td><td id="td_0">' + '×';
        }
      }
      if (sum <= weeks - 5) { // 欠席が多い場合
        table += '</td><td id="td_many">' + sum;
      } else {
        table += '</td><td>' + sum;
      }
      table += '</td></tr>';
    }
    return table;
  } catch {
    return 'error';
  }
}

// ----- 履修している科目の出席リスト取得 ----- (user_id, lecture_id)
async function create_lec_lecture_table(user_id, lecture_id) {
  try {
    var week_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id); // 何週目までか
    var weeks = week_val[0].weeks;
    var res_list = await db_query('SELECT student_id, week, result, datetime FROM team7.attendance WHERE lecture_id = ? AND student_id = ?', [lecture_id, user_id]);
    var table = '';
    var lec_list_arr = {};
    for (var row of res_list) {
      lec_list_arr[row.week] = 1;
      if (row.week > weeks) weeks = row.week;
    }

    // テーブルのヘッダ部分
    table += '<tr><th>履修者ID</th> <th>履修者名</th>';
    for (var i = 0; i < weeks; i++) {
      table += '<th>' + (i+1) + '</th>'; 
    }
    table += '<th>出席回数</th></tr>';

    // テーブルのデータ部分
    table += '<tr><td>'+ user_id +'</td><td>' + await get_name(user_id);
    sum = 0;
    for (var i = 0; i < weeks; i++) {
      if (lec_list_arr[i+1] == 1) {
        table += '</td><td id="td_1">' + '〇';
        sum++;
      } else {
        table += '</td><td id="td_0">' + '×';
      }
    }
    table += '</td><td>'+ sum +'</td></tr>';
    return table;
  } catch {
    return 'error';
  }
}

// ----- 講義の担当か確認 ----- (user_id, lecture_id)
async function check_lecture(user, lec) {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules WHERE lecture_id = ? AND teacher_id = ? LIMIT 1', [lec, user]);
    if (res_list.length > 0) return true;
    return false;
  } catch {
    return false;
  }
}

// ----- 講義を履修しているか確認 ----- (user_id, lecture_id)
async function check_lecture_major(user, lec) {
  try {
    var res_list = await db_query('SELECT * FROM team7.student_timetable WHERE lecture_id = ? AND student_id = ? LIMIT 1', [lec, user]);
    if (res_list.length > 0) return true;
    return false;
  } catch {
    return false;
  }
}

// ----- 履修者IDから名前を取得 ----- (user_id)
async function get_name(user_id) {
  try {
    var res_list = await db_query('SELECT student_name FROM team7.student_list WHERE student_id = ? LIMIT 1', user_id);
    if (res_list[0].student_name) return res_list[0].student_name;
    return false;
  } catch {
    return false;
  }
}

// ----- 出席登録 ----- (lecture_id, user_id, week)

// ----- IDmからユーザIDを取得 ----- (IDm)
async function check_idm_user(idm) {
  try {
    var res_list = await db_query('SELECT student_id FROM team7.student_list WHERE idm = ? LIMIT 1', idm);
    if (res_list.length > 0) return res_list.student_id;
    return false;
  } catch {
    return false;
  }
}

// ----- 講義ID から講義名取得 ----- (lecture_id)
async function get_lecture_name(lecture_id) {
  try {
    var res_list = await db_query('SELECT lecture_name FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id);
    if (res_list[0].lecture_name) return res_list[0].lecture_name;
    return 'error';
  } catch {
    return 'error';
  }
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
exports.get_pass = get_pass;
exports.check_user_api = check_user_api;
exports.create_teacher_table = create_teacher_table;
exports.create_student_table = create_student_table;
exports.update_pass = update_pass;
exports.create_lec_student_table = create_lec_student_table;
exports.create_lec_lecture_table = create_lec_lecture_table;
exports.check_lecture = check_lecture;
exports.check_lecture_major = check_lecture_major;
exports.get_lecture_name = get_lecture_name;