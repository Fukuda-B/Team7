/*
    Team7 server js - api | Update: 2021/06/15
    Our project: https://github.com/Fukuda-B/Team7

    memo:
        API Key: AES({"u":user + "p":pass})

        http://localhost:8080/api/v1/team7?x=de49dd2756ad884762d76453bf624a6438800fcfd79f0dbd295b6a010f5eae9d1cf89de76a1ab2ec4c8bc12c06b25886fcd1093c76111fb166c19759369e375809b26592dd3b37db4b7795b9478bae481e65e02706fd16b046f1f19061f919fe48561f10ed19ebbd7063a87434464012bf98608dbe9337d50c1f10d9ff57a1ff822ae9d2aad536e8a9189e131312ecf43a0cf6efb1b38b2a143d1e8e6bd5f3cd0fd4738fb8b47d5972b61c7a0baa2b4a03a9a220291f6943eef7059a663e144961bd1b76548cccbe77cc07e29c2ce32842d9431f6b2c4bb3fac7b9a79f02ac4bf59061f3a644413a488f3e09cab41ca620ccce7399375129f192ca0c7aee2c4d8716b4c1217a76b5b4b2acff1913273d63b4c39b56fbcd373d6c60ead72729144d4b1258b2837d87774d1119d405e9d1ffd7f5f12980f4855eb42a1d8cf9db8b58fe4086bc68fdd023b1c2d51c762747a78594a0908d4f50ab64bf896cf2df7719af6ea57912b6699049e60d71b9658f0e827a9dbff164ab25f64c54877dab74b490d30980b6879903315097c973965c27772a9f50959eece3acdf355525472fbf43bba3d148efe12ca13367456cfb358c47c256e62bd3c05b9ac5daeba1dd9d97436ee6a226fcee71bbb2b22fd3ed9a57ef722c88b6b0496d09f610c459fb494a991c8aed5d7aa8344fc2d63cd3fd216221ef40c121d2379b6fd3e0ff932e31f60ed836ed5c8dd5be5ea8af30c45f8ba3aef4bd846704ba49d7011cd360c06aec52f75395d9f42de832748460496a2e8a660eeef4ff0789efe82de045daa2143a298eda60476966121cc309a0a542725454d5d37ad3c060366dd609c516ac84a8dd0799f375656db592cd417e79c2728a9b4fe9f4a1acc70bdec7ae19354105fa8e9a0dd483f416d4a0050cdb89fe96a7bae103ed0e09f96f832db733ab2cdeea4572446eec0a7816ccb525f0c98e28fa6f158d9fecd2b73a42f37779cf832cd20a4cf17f585b7212ab4a9363c2ff211bdbbdec4bf8b3e36e9807c8d7746b1429aeaf0208eed45c5b74c4e5ae0381b430c7a292c73447293e4119a9348342c1e9b0fc318a20afeeeb5f4f057e8e04205b107c6b9736ae17ae51c849f0fdf05577e52102fe9f853b42705b4fc4c1353fe23ae482b8267dda8bfeed51cbb7cb601be2f94398aee96d5e06723217bdf350e4d7293ef4e49179ec1797e653956985c337cf891cbcbc46f97ca123220cafe7fd65d82588d698aa9914b509f51871224c23a678df865bf7c1021eb8ae10f12a
*/

'use strict'
const express = require('express');
const router = express.Router();
const fs = require('fs');

var res_json = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
var user_list = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
const bank_api = require('./cryp.js').bank_api;
const CRYP = require('./cryp.js').CRYP;
const get_key = require('./cryp.js').get_key;
const database = require('./database.js');
const output = require('./output.js');

var send_test = [] // リクエスト受け取りテスト

router
  // GET req
  .get('/', isAuthenticated_nos, function (req, res) { // /api
    // .get('/', function (req, res) {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(send_test));
  })
  .get('/v1/team7', isAuthenticated_nos, async function (req, res) { // APIエンドポイント
    var val = req.body;
    val.x = '*****';
    send_test.push(val);
    // console.log(send_test);
    if (val.multiple == "False") {
      var result = await database.add_attendance_api(val);
    } else {
      var datas = JSON.parse(val.datas);
      try {
        var tmp_jj = {};
        for (var row of datas) {
          tmp_jj = {
            "lecture_id": row[0],
            "week": row[1],
            "student_id": row[2],
            "user_idm": row[3],
            "result": row[4],
            "date": row[5]
          };
          // console.log(tmp_jj);
          await database.add_attendance_api(tmp_jj);
        }
        var result = true;
      } catch {
        var result = false;
      }
    }
    if (result) {
      res.send('ok');
    } else {
      res.send('error');
    }
  })
  .get('/v1/lecture_date', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_lecture_date_api();
    if (val) {
      var fname = 'lecture_date.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })
  .get('/v1/lecture_rules', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_student_list_api();
    if (val) {
      var fname = 'lecture_rules.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })
  .get('/v1/student_timetable', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_student_timetable_api();
    if (val) {
      var fname = 'studnet_timetable.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })
  // .get('/v1/gkey', function (req, res) {
  //     res.send(get_key(user_list.b));
  // })
  // .get('/v1/argon2', function (req, res) { // argon2のハッシュ値導出
  //   CRYP.argon2_h(req.query.x, bank_api).then((val) => {
  //     console.log(val);
  //     res.send(val);
  //   });
  // })

  // POST req
  .post('/v1/team7', isAuthenticated_nos, async function (req, res) { // APIエンドポイント
    var val = req.body;
    val.x = '*****';
    send_test.push(val);
    // console.log(send_test);
    if (val.multiple == "False") {
      var result = await database.add_attendance_api(val);
    } else {
      var datas = JSON.parse(val.datas);
      try {
        var tmp_jj = {};
        for (var row of datas) {
          tmp_jj = {
            "lecture_id": row[0],
            "week": row[1],
            "student_id": row[2],
            "user_idm": row[3],
            "result": row[4],
            "date": row[5]
          };
          // console.log(tmp_jj);
          await database.add_attendance_api(tmp_jj);
        }
        var result = true;
      } catch {
        var result = false;
      }
    }
    if (result) {
      res.send('ok');
    } else {
      res.send('error');
    }
  })
  .post('/v1/lecture_date', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_lecture_date_api();
    if (val) {
      var fname = 'lecture_date.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })
  .post('/v1/lecture_rules', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_lecture_rules_api();
    if (val) {
      var fname = 'lecture_rules.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })
  .post('/v1/student_timetable', isAuthenticated_nos, async function (req, res) {
    var val = await database.create_student_timetable_api();
    if (val) {
      var fname = 'studnet_timetable.csv';
      var send_callback = function() {
        var raw = fs.createReadStream(fname);
        res.writeHead(200, {'Content-Type': 'text/csv','Content-disposition': 'attachment; filename = '+fname});
        raw.pipe(res);
      }
      output.csv_gen(val, fname, send_callback);
    } else {
      res.send('error');
    }
  })

async function isAuthenticated_nos(req, res, next) {
  try {
    if (req.query.x) {
      var dec = CRYP.decryptoo(req.query.x, false);
    } else if (req.body.x) {
      var dec = CRYP.decryptoo(req.body.x, false);
    }
    var dec_p = JSON.parse(dec);
    if (await database.check_user(dec_p.u, dec_p.p) && await database.check_user_admin(dec_p.u, dec_p.p)) {
      return next(); // パスワードが合っていて、管理者
    } else {
      res.send('bad request');
    }
  } catch {
    res.send('bad request');
  }
}

module.exports = router;
