var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'newuser',
  password : 'new_user_b&!',
});

connection.connect(function(err) { // 接続時のエラー処理
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

connection.query('SELECT * FROM team7.lecture_rules;', function (error, results, fields) {
  console.log(fields);
})
