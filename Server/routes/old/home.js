/*
    Team7 server js - home | Update: 2021/05/25
    Our project: https://github.com/Fukuda-B/Team7
*/

'use strict'
var express = require('express');
var router = express.Router();
var fs = require('fs');
var jsonFile = './routes/user_json.json';
function createTable(lecture_json) {
    var lecture_table = '',
    tmp = '';
    for(var i=0; i<lecture_json.lecture.length; i++) {
        tmp = lecture_json.lecture[i];
        // console.log(tmp.lecture_date);
        lecture_table += '<tr><td>'+tmp.lecture_name
            +'</td><td>'+tmp.lecture_date.f+' '
            +tmp.lecture_date.w+' '
            +tmp.lecture_date.t
            +'</td><td>'+tmp.lecture_teach
            +'</td><td>'+tmp.lecture_par+'%</td></tr>';
    }
    return lecture_table;
}

var lecture_json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
var lecture_table = createTable(lecture_json);

// 認証済みか確認する関数
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login'); // ログインページへリダイレクト
    }
}

router
    // GET req
    .get('/', isAuthenticated,
        (req, res) => {
        res.render('home', {
            title: 'Team7',
            lecture_table: lecture_table,
            user_id: lecture_json.user_id
        });
    })

module.exports = router;
