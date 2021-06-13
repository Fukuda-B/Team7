/*
    Team7 server js - api | Update: 2021/06/10
    Our project: https://github.com/Fukuda-B/Team7
*/

'use strict'
const express = require('express');
const router = express.Router();

const fs = require('fs');
const path = require('path');
var res_json = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));


router
    // GET req
    .get('/', isAuthenticated_nos, function (req, res) {
    // .get('/', function (req, res) {
        res.send('team7 - api');
    })
    .get('/v1/team7', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    })

    // POST req
    .post('/v1/team7', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    });

function isAuthenticated_nos(req, res, next) {
    if (req.body.length>0 && check_user(req.body.u, req.body.p)) {
        return next();
    } else {
        res.send('bad request');
    }
}
function check_user() {
    return true;
}

module.exports = router;
