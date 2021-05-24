/*
    Team7 server js | Update: 2021/05/25
*/

'use strict'
var express = require('express');
var router = express.Router();

var var_pack = {
    title: 'Team7',
}

router
    // GET req
    .get('/', (req, res) => {
        res.render('index', var_pack)
    })
    .get('/login', (req, res) => {
        res.render('login', var_pack)
    })
    .get('/api/v1/team7', (req, res) => {
        res.render('api', var_pack)
    })

    // POST req
    .post('/api/v1/team7', function(req, res) {
        var _username = req.body.username;
        var _userid = req.body.userid;
        res.render('api', {...var_pack, ...{username: _username}});
    })

module.exports = app;
