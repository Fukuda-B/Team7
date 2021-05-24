/*
    Team7 server js | Update: 2021/05/25
*/

'use strict'
var express = require('express');
var router = express.Router();

router
    // GET req
    .get('/', (req, res) => {
        res.render('index', {title: 'Team7'});
    })
    .get('/login', (req, res) => {
        res.render('login', {title: 'Team7 | Login'});
    })
    .get('/api/v1/team7', (req, res) => {
        res.render('api', {title: 'Team7 | API'});
    })

    // POST req
    .post('/api/v1/team7', function(req, res) {
        var _username = req.body.username;
        var _userid = req.body.userid;
        res.render('api',{title: 'Team7 | API'});
    })

module.exports = router;
