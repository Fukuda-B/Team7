var mysql      = require('mysql');
// 循環してしまうため、crypはインポート不可

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
          tx = '<a href="/main?dl='+row.lecture_id+'&format=csv" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-csv"></i>csv</a>' +
          '<a href="/main?dl='+row.lecture_id+'&format=xlsx" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-excel"></i>xlsx</a>';
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
    var res_list = await db_query('SELECT student_id, team7.student_timetable.lecture_id, lecture_name, teacher_id, teacher_name, start_time, end_time, attend_limit, late_limit, exam, day_of_week, weeks FROM team7.student_timetable LEFT OUTER JOIN team7.lecture_rules ON team7.student_timetable.lecture_id = team7.lecture_rules.lecture_id WHERE student_id = ?;', user);
    var table = '';
    var exx, tx;
    for (var row of res_list) {
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

// ----- 履修者の出欠リスト取得 ----- (lecture_id, 強調表示する条件(休み), 強調表示する条件(遅刻))
async function create_lec_student_table(lecture_id, limit_absence, limit_lateness) {
  try {
    var week_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id); // 何週目までか
    var weeks = week_val[0].weeks;
    var res_list = await db_query('SELECT team7.student_list.student_id, student_name FROM team7.student_timetable LEFT JOIN team7.student_list ON team7.student_timetable.student_id = team7.student_list.student_id WHERE lecture_id = ?;', lecture_id);
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
      table += '</td><td>' + row.student_name;
      sum = 0;
      for (var i = 0; i < weeks; i++) {
        if (std_list_arr[row.student_id][i+1] == 1) {
          sum++;
          table += '</td><td id="td_1">' + '〇';
        } else {
          table += '</td><td id="td_0">' + '×';
        }
      }
      if (weeks - sum >= limit_absence) { // 欠席が多い場合
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

// ----- 編集ページの初期値取得 ----- (lecture_id)
async function get_lecture_edit_info(lecture_id) {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id);
    if (res_list) {
      var res = {
        "attend_limit": res_list[0].attend_limit,
        "late_limit": res_list[0].late_limit,
        "weeks": res_list[0].weeks,
      };
      res["start_time"] = res_list[0].start_time.slice(0, -3); // 秒のところを消して代入
      res["end_time"] = res_list[0].end_time.slice(0, -3); // 秒のところを消して代入
      if (res_list[0].exam == 0) { // 試験
        res["exam"] = ['selected', ''];
      } else {
        res["exam"] = ['', 'selected'];
      }
      res["day_of_week"] = ['', '', '', '', '', '', ''];
      var wk_list = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (var i = 0; i < wk_list.length; i++) {
        if (res_list[0].day_of_week == wk_list[i]) res["day_of_week"][i] = 'selected';
      }
      return res;
    }
    return false;
  } catch {
    return false;
  }
}

// ----- 講義情報の修正 ----- (lecture_id, json)
async function update_lecture(lecture_id, data) {
  try {
    var unpack = [data.start_time, data.end_time, data.attend_limit, data.late_limit, data.exam, data.day_of_week, data.weeks, lecture_id];
    await db_query('UPDATE team7.lecture_rules SET start_time = ?, end_time = ?, attend_limit = ?, late_limit = ?, exam = ?, day_of_week = ?, weeks = ? WHERE lecture_id = ?', unpack);
    return true;
  } catch {
    return false;
  }
}

// ----- 講義の出欠一覧(2次元リスト)を返す(csv/xlsx出力用) ----- (lecture_id)
async function get_lecture_table(lecture_id) {
  try {
    var week_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id); // 何週目までか
    var weeks = week_val[0].weeks;
    var res_list = await db_query('SELECT team7.student_list.student_id, student_name FROM team7.student_timetable LEFT JOIN team7.student_list ON team7.student_timetable.student_id = team7.student_list.student_id WHERE lecture_id = ?;', lecture_id);
    var std_list = await db_query('SELECT student_id, week, result, datetime FROM team7.attendance WHERE lecture_id = ?', lecture_id);

    var std_list_arr = {}; // 出欠状況を連想配列として入れておく
    for (var row of std_list) {
      if (!std_list_arr[row.student_id]) std_list_arr[row.student_id] = {};
      std_list_arr[row.student_id][row.week] = 1;
      if (row.week > weeks) weeks = row.week; // 最終週の更新
    }

    // テーブルのヘッダ部分
    var table = [['履修者ID', '履修者名']];
    for (var i = 0; i < weeks; i++) {
      table[0].push(i+1);
    }
    table[0].push('出席回数');

    // テーブルのデータ部分
    var sum = 0; // 合計出席回数を計算するために使う一時的な変数
    var arr_p = []; // 一時的なデータを入れる配列
    for (var row of res_list) {
      arr_p = [];
      arr_p.push(row.student_id);
      arr_p.push(row.student_name);
      sum = 0;
      for (var i = 0; i < weeks; i++) {
        if (std_list_arr[row.student_id][i+1] == 1) {
          sum++;
          arr_p.push('〇');
        } else {
          arr_p.push('×');
        }
      }
      arr_p.push(sum);
      table.push(arr_p);
    }
    return table;
  } catch {
    return false;    
  }
}

// ----- WebAPI student_listのcsv -----
async function create_student_list_api() {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules',);
    if (res_list) {
      var arr = [];
      var row = [];
      arr.push(["講義ID", "科目名", "ID", "教員名", "開始時間", "終了時間", "出席限度", "遅刻限度", "試験", "履修者", "曜日", "weeks"]);
      for (var vv of res_list) {
        row = vv[0];
        console.log(vv[0]);
        arr.push(
          row.lecture_id,
          row.lecture_name,
          row.teacher_id,
          row.teacher_name,
          row.start_time,
          row.end_time,
          row.attend_limit,
          row.late_limit,
          row.exam,
          row.number_of_students,
          row.day_of_week,
          row.weeks
        );
      }
      return arr;
    } else {
      return false;
    }
  } catch {
    return false;
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
exports.create_teacher_table = create_teacher_table;
exports.create_student_table = create_student_table;
exports.update_pass = update_pass;
exports.create_lec_student_table = create_lec_student_table;
exports.create_lec_lecture_table = create_lec_lecture_table;
exports.check_lecture = check_lecture;
exports.check_lecture_major = check_lecture_major;
exports.get_lecture_name = get_lecture_name;
exports.get_lecture_edit_info = get_lecture_edit_info;
exports.update_lecture = update_lecture;
exports.get_lecture_table = get_lecture_table;
exports.create_student_list_api = create_student_list_api;