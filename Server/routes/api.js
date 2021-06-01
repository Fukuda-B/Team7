/*
    Team7 server js - api | Update: 2021/05/25
*/

'use strict'
var express = require('express');
var router = express.Router();

router
    // GET req
    .get('/', function(req, res, next) {
        res.render('api', {title: 'Team7 | API'});
    })

    // POST req
    .post('/', function(req, res) {
        var _username = req.body.username;
        var _userid = req.body.userid;
        res.render('api',{title: 'Team7 | API'});
    });

module.exports = router;
