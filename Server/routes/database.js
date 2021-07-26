/*
  Team7 server - database module
	Our project: https://github.com/Fukuda-B/Team7
*/

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
          tx = '<a href="/main?p=edit&l='+row.lecture_id+'"><i class="fas fa-pencil-alt"></i>情報修正</a>&emsp;' +
          '<a href="/main?p=edit_date&l='+row.lecture_id+'"><i class="fas fa-calendar-week"></i>日程</a>&emsp;' +
          '<a href="/main?p=edit_major&l='+row.lecture_id+'"><i class="fas fa-user-edit"></i>履修者</a>';
          break;
        case 'home':
          tx = '<a href="/main?dl='+row.lecture_id+'&format=csv&encode=utf_8" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-csv"></i>csv <span>(utf-8)</span></a>' +
          '<a href="/main?dl='+row.lecture_id+'&format=csv&encode=shift_jis" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-csv"></i>csv <span>(shift-jis)</span></a>' +
          '<a href="/main?dl='+row.lecture_id+'&format=xlsx" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-excel"></i>xlsx</a>';
          break;
        case 'edit_date':
          tx = '<a href="/main?p=course&l='+row.lecture_id+'">詳細<i class="fas fa-file-alt"></i></a>';
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
async function create_lec_student_table(lecture_id, limit_absence, limit_lateness, page) {
  try {
    var week_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id); // 何週目までか
    var weeks = week_val[0].weeks;
    var res_list = await db_query('SELECT team7.student_list.student_id, student_name FROM team7.student_timetable LEFT JOIN team7.student_list ON team7.student_timetable.student_id = team7.student_list.student_id WHERE lecture_id = ?;', lecture_id);
    var std_list = await db_query('SELECT student_id, week, result, datetime FROM team7.attendance WHERE lecture_id = ?', lecture_id);
    var table = '';

    var std_list_arr = {}; // 出欠状況を連想配列として入れておく
    for (var row of std_list) {
      if (!std_list_arr[row.student_id]) std_list_arr[row.student_id] = {};
      if (row.result == '出席') {
        std_list_arr[row.student_id][row.week] = 1; // 出席
      } else if (row.result == '遅刻') {
        std_list_arr[row.student_id][row.week] = 2; // 遅刻
      } else {
        std_list_arr[row.student_id][row.week] = 0; // 欠席
      }
      // if (row.week > weeks) weeks = row.week; // 最終週の更新
    }

    // テーブルのヘッダ部分
    table += '<tr><th>履修者ID</th> <th>履修者名</th>';
    for (var i = 0; i < weeks; i++) {
      table += '<th>' + (i+1) + '</th>'; 
    }
    table += '<th>出席回数</th></tr>';

    // テーブルのデータ部分
    var sum = 0; // 合計出席回数を計算するために使う一時的な変数
    var sum_late = 0 // 合計遅刻回数の判定のための変数
    for (var row of res_list) {

      if (page == 'edit') {
        table += '<tr><td><a href=?p=edit&l='+lecture_id+'&sid='+row.student_id+'>'+row.student_id+'</a>';
      } else {
        table += '<tr><td>' + row.student_id;
      }
      table += '</td><td>' + row.student_name;
      sum = 0; // リセット
      sum_late = 0; // リセット
      for (var i = 0; i < weeks; i++) {
        if (std_list_arr[row.student_id][i+1] == 1) { // 1 = 出席
          sum++;
          table += '</td><td id="td_1">' + '〇';
        } else if (std_list_arr[row.student_id][i+1] == 2) { // 2 = 遅刻
          sum_late++;
          sum++;
          table += '</td><td id="td_2">' + '△';
        } else { // 0 = 欠席
          table += '</td><td id="td_0">' + '×';
        }
      }
      if (weeks - sum >= limit_absence || sum_late >= limit_lateness) { // 欠席, 遅刻が多い場合
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

// ----- WebAPI lecture_rulesのcsv -----
async function create_lecture_rules_api() {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules',);
    if (res_list) {
      var arr = [];
      // var row = [];
      arr.push(["講義ID", "科目名", "ID", "教員名", "開始時間", "終了時間", "出席限度", "遅刻限度", "試験", "履修者", "曜日", "weeks"]);
      for (var row of res_list) {
        arr.push([
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
        ]);
      }
      return arr;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// ----- WebAPI student_timetableのcsv -----
async function create_student_timetable_api() {
  try {
    var lecture_val = await db_query('SELECT lecture_id FROM team7.lecture_rules');
    var lecture_list = []; // 講義リスト
    for (var row of lecture_val) {
      lecture_list.push(row.lecture_id);
    }

    var studnet_val = await db_query('SELECT student_id, student_name, gender, idm FROM team7.student_list');
    var student_list  = []; // 学生リスト
    var studnet_index = []; // インデックス探索用
    var miri = []; // 全部未履修にしておく
    for (var row of lecture_list) {
      miri.push('未履修');
    }
    for (var row of studnet_val) {
      student_list.push([row.student_id, row.student_name, row.gender, row.idm].concat(miri));
      studnet_index.push(row.student_id);
    }

    // var res_list = await db_query('SELECT team7.student_list.student_id, student_name, gender, idm, lecture_id FROM team7.student_timetable LEFT JOIN team7.student_list ON team7.student_timetable.student_id = team7.student_list.student_id');
    var res_list = await db_query('SELECT * FROM team7.student_timetable WHERE student_id != "学籍番号"'); // なんか studnet_id = 学籍番号 が含まれているからのぞく
    if (res_list) {
      var arr = [["学籍番号", "名前", "性別", "IDm"].concat(lecture_list)]; // ヘッダー
      var x, y;
      var arr_cc = arr.concat(student_list);
      for (var row of res_list) {
        x = 4 + lecture_list.indexOf(row.lecture_id);
        y = 1 + studnet_index.indexOf(row.student_id);
        arr_cc[y][x] = '履修';
      }
      return arr_cc;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// ----- WebAPI lecture_dateのcsv -----
// バグの可能性あり
async function create_lecture_date_api() {
  try {
    var lecture_val = await db_query('SELECT lecture_id, weeks FROM team7.lecture_rules');
    var lecture_list = []; // 講義リスト
    var max_week = 0;
    for (var row of lecture_val) {
      if (max_week < row.weeks) max_week = row.weeks;
      lecture_list.push(row.lecture_id);
    }
    var ix;
    var arr = [];
    var lecture_date_val = await db_query('SELECT * FROM team7.lecture_date');
    var week_arr = ["lecture_id"];
    var week_arr_c = [];
    for (var i = 0; i < max_week; i++) {
      week_arr.push(i+1);
      week_arr_c.push('');
    }
    for (var row of lecture_list) {
      arr.push([row].concat(week_arr_c));
    }
    var date, tmp, year, month, day;
    for (var row of lecture_date_val) {
      ix = lecture_list.indexOf(row.lecture_id);
      date = Date.parse(row.date); // パース
      tmp = new Date(date); // date型に
      date = tmp.toISOString();
      arr[ix][row.week] = date.slice(0,10);
    }
    return [week_arr].concat(arr);
  } catch {
    return false;
  }

}

// ----- WebAPI lecture_dateのcsv -----
async function add_attendance_api(req_body) {
  try {
    var rb = req_body;
    var pre_pack = [rb.lecture_id, rb.week, rb.user_idm];
    var ck = await db_query('SELECT * FROM team7.attendance WHERE lecture_id = ? AND `week` = ? AND idm = ?', pre_pack);
    if (ck.length == 0) { // 重複して追加しないように..
      var pack = [rb.lecture_id, rb.student_id, rb.week, rb.result, rb.date, rb.user_idm, rb.lecture_id, rb.week, rb.idm];
      await db_query('INSERT INTO team7.attendance (lecture_id, student_id, `week`, result, `datetime`, idm) SELECT ?, ?, ?, ?, ?, ? FROM DUAL WHERE NOT EXISTS(SELECT "x" FROM team7.attendance WHERE lecture_id=? AND `week`=? AND idm=?);', pack);
    }
    return true;
  } catch {
    return false;
  }
}

// ----- update lecture_date -----
async function update_lecuture_date(lecture_id, data) {
  try {
    var pack = [data.date, lecture_id, data.week];
    // console.log(pack);
    await db_query('UPDATE team7.lecture_date SET date = ? WHERE lecture_id = ? AND `week` = ?', pack);
    return true;
  } catch {
    return false;
  }
}

// ----- create_lecture_date_table -----
async function create_lecture_date_table(lecture_id) {
  try { // orderでweek順で並び替え
    var res_list = await db_query('SELECT * FROM team7.lecture_date WHERE lecture_id = ? ORDER BY `week`;', lecture_id);
    var rec_list = await db_query('SELECT * FROM team7.lecture_rules WHERE lecture_id = ? LIMIT 1', lecture_id);
    if (res_list && rec_list) {
      var table = '<tr><th>講義回</th> <th>日時</th> <th>適用</th></tr>';
      var dt_tmp, dt_val;
      var week_cnt = 0;
      for (row of res_list) {
        if (week_cnt >= rec_list.weeks) break; // データより講義回が少ない
        week_cnt++;
        dt_tmp = new Date(Date.parse(row.date));
        dt_val = dt_tmp.getFullYear() + '-' + ('0' + (dt_tmp.getMonth()+1)).slice(-2) + '-' + ('0' + dt_tmp.getDate()).slice(-2);
        table += '</tr></td><td>' + row.week +
        '</td><td><input type="date" id="date_'+row.week+'" value="' + dt_val + '">'+
        '</td><td><button id="date_change" onclick="ajax('+row.week+');">適用</button>'+
        '</td></tr>';
      }
      for (var i = 0; i < rec_list.weeks - res_list.length; i++) { // データより講義回が多い場合追加
        table += '</tr></td><td>' + row.week +
        '</td><td><input type="date" id="date_'+(res_list+i)+'" value="">'+
        '</td><td><button id="date_change" onclick="ajax('+(res_list+i)+');">適用</button>'+
        '</td></tr>';
      }
      return table;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// ----- get_graph_val | グラフ出力に必要なデータ生成 -----
async function get_graph_val(user) {
  try {
    var res_list = await db_query('SELECT * FROM team7.lecture_rules WHERE teacher_id = ?', user);
    if (res_list) {
      var dic_list = {};
      var lec_list = [];
      var ttmp, rr_list; // 週ごとのカウント
      var ntmp, nom_list = {}; // 履修者数
      for (var row of res_list) {
        ttmp = [];
        // var rr_list = await db_query('SELECT lecture_id, `week`, COUNT(*) FROM team7.attendance WHERE lecture_id = ? GROUP BY `week` ORDER BY `week`;',row.lecture_id);
        var rr_list = await db_query('SELECT team7.attendance.lecture_id, `week`, COUNT(team7.attendance.lecture_id) FROM team7.attendance INNER JOIN team7.student_timetable ON team7.attendance.lecture_id = team7.student_timetable.lecture_id AND team7.attendance.student_id = team7.student_timetable.student_id WHERE team7.attendance.lecture_id = ? AND result IN ("出席", "遅刻") GROUP BY `week` ORDER BY `week`;', row.lecture_id);
        var ntmp = await db_query('SELECT COUNT(student_id) FROM team7.student_timetable WHERE lecture_id = ?;', row.lecture_id);
        // console.log(ntmp);
        // console.log(rr_list);
        for (var i = 0; i < rr_list.length; i++) {
          if (i >= row.weeks) break;
          // console.log(row.lecture_id+' '+row.weeks+' '+(i+1)+' '+rr_list[0]["COUNT(*)"]);
          // if (!rr_list[i]) rr_list[i]["COUNT(*)"] = 0;
          ttmp.push({
            // "label": row.weeks,
            "x": (i+1),
            "y": rr_list[i]["COUNT(team7.attendance.lecture_id)"],
          });
        }
        for (var i = 0; i < (row.weeks - rr_list.length); i++) {
          ttmp.push({
            "x": (rr_list.length+i),
            "y": 0,
          });
        }
        dic_list[row.lecture_id] = ttmp;
        lec_list.push(row.lecture_id);
        // console.log(ntmp[0]["COUNT(*)"]);
        nom_list[row.lecture_id] = ntmp[0]["COUNT(student_id)"];
      }
      // console.log(dic_list);
      // console.log(lec_list);
      return [dic_list, lec_list, nom_list]; // 週ごとの連想配列, 科目リスト, 履修者数リスト
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// ----- 履修者の更新 -----
async function update_lecture_major(lecture_id, data) {
  try {
    var sql = 'INSERT INTO team7.student_timetable (student_id, lecture_id) VALUES ';
    var pack = [];
    var uid;
    for (var i = 0; i < data.length; i++) {
      row = data[i];
      if (row["学籍番号"]) {
        uid = row["学籍番号"];
      } else {
        uid = row["履修者ID"];
      }
      if (i+1 < data.length) {
        sql += ' ("'+uid+'", "'+lecture_id+'"),';
      } else {
        sql += ' ("'+uid+'", "'+lecture_id+'")';
      }
      pack.push(uid, lecture_id);
    }
    // delete all
    await db_query('DELETE FROM team7.student_timetable WHERE lecture_id = ?', lecture_id);
    // console.log(sql);
    // console.log(pack);
    await db_query(sql, pack);
    return true;
  } catch {
    return false;
  }
}

// ----- 履修者の出席管理テーブルの取得 -----
async function get_student_attend_table(lecture_id, student_id) {
  try {
    var weeks_val = await db_query('SELECT weeks FROM team7.lecture_rules WHERE lecture_id = ?;', lecture_id);
    var weeks = weeks_val[0].weeks;
    var result_val = await db_query('SELECT `week`, `result` FROM team7.attendance WHERE lecture_id = ? AND student_id = ?;', [lecture_id, student_id]);
    var tmp = {};
    for (var row of result_val) {
      tmp[row["week"]] = row["result"];
    }
    table = '<tr><th>&emsp;週&emsp;</th> <th>出席状況</th> <th>&emsp;適用</th></tr>';
    var sel_val = [];
    for (var i = 1; i <= weeks; i++) {
      table += '<tr><td>'+(i);
      table += '</td><td><select id="val_'+(i)+'">';
      sel_val = ['', '', ''];
      if (tmp[i] && tmp[i] == "出席") sel_val[0] = 'selected';
      else if (tmp[i] && tmp[i] == "遅刻") sel_val[1] = 'selected';
      else sel_val[2] = 'selected';
      table += '<option value="出席" '+sel_val[0]+'>〇 出席</option>';
      table += '<option value="遅刻" '+sel_val[1]+'>△ 遅刻</option>';
      table += '<option value="欠席" '+sel_val[2]+'>×&nbsp; 欠席</option>';
      table += '</select>';
      table += '</td><td>&emsp;<button id="attend_change" onclick="ajax('+(i)+');">適用</button>';
      table += '</td></tr>';
    }
    return table;
  } catch {
    return false;
  }
}

// ----- 履修者の出席情報の更新 -----
async function update_student_attend(lecture_id, student_id, week, result) {
  try {
    // 最初に削除
    await db_query('DELETE FROM team7.attendance WHERE lecture_id = ? AND student_id = ? AND `week` = ?',[lecture_id, student_id, week]);
    // 追加
    await db_query('INSERT INTO team7.attendance (lecture_id, student_id, `week`, result) VALUES (?, ?, ?, ?);',[lecture_id, student_id, week, result]);
    return true;
  } catch {
    return false;
  }
}

// ----- 講義の追加 -----
async function add_lecture(teacher_id, data) {
  try {
    var teacher_name = await db_query('SELECT teacher_name FROM team7.teacher_list WHERE teacher_id = ? LIMIT 1;', teacher_id);
    if (teacher_name) {
      // lecture_rulesの追加
      var parsed = [data["lecture_id"], data["lecture_name"], teacher_id, teacher_name[0]["teacher_name"], data["start_time"], data["end_time"], data["attend_limit"], data["late_limit"], data["exam"], 0, data["day_of_week"], data["weeks"]];
      await db_query('DELETE FROM team7.lecture_rules WHERE lecture_id = ?', data["lecture_id"]);
      await db_query('INSERT INTO team7.lecture_rules (lecture_id, lecture_name, teacher_id, teacher_name, start_time, end_time, attend_limit, late_limit, exam, number_of_students, day_of_week, weeks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', parsed);
      // lecture_dateの追加
      var insert_data = 'INSERT INTO team7.lecture_date (lecture_id, week, date) VALUES';
      var dd_obj = new Date(Date.parse(data["start_date"]));
      var ins_date;
      for (var i = 0; i < data["weeks"]-1; i++) {
        dd_obj.setDate(dd_obj.getDate() + 7);
        ins_date = dd_obj.getFullYear()+'-'+('0'+(dd_obj.getMonth()+1)).slice(-2)+'-'+('0'+dd_obj.getDate()).slice(-2);
        insert_data += ' ("'+data["lecture_id"]+'", '+(i+1)+', "'+ins_date+'"),';
      }
      dd_obj.setDate(dd_obj.getDate() + 7);
      ins_date = dd_obj.getFullYear()+'-'+('0'+(dd_obj.getMonth()+1)).slice(-2)+'-'+('0'+dd_obj.getDate()).slice(-2);
      insert_data += ' ("'+data["lecture_id"]+'", '+data["weeks"]+', "'+ins_date+'");';
      await db_query('DELETE FROM team7.lecture_date WHERE lecture_id = ?', data["lecture_id"]);
      await db_query(insert_data);
      return true;
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
exports.create_lecture_rules_api = create_lecture_rules_api;
exports.create_student_timetable_api = create_student_timetable_api;
exports.create_lecture_date_api = create_lecture_date_api;
exports.add_attendance_api = add_attendance_api;
exports.update_lecture_date = update_lecuture_date;
exports.create_lecture_date_table = create_lecture_date_table;
exports.get_graph_val = get_graph_val;
exports.update_lecture_major = update_lecture_major;
exports.get_student_attend_table = get_student_attend_table;
exports.update_student_attend = update_student_attend;
exports.add_lecture = add_lecture;