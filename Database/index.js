var mysql = require('mysql');
const fs = require('fs');
var secret = fs.readFileSync("../root.txt");

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : secret
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});
