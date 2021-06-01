/*
    Team7 server js - api | Update: 2021/06/02
*/

'use strict'
var express = require('express');
var router = express.Router();

var js = {
    "user": {
        "name": "A",
        "attendance": {
            1:true,
            2:false,
            3:true,
            4:true,
            5:true,
        },
    },
    "user2": {
        "name": "B",
        "attendance": {
            1:true,
            2:true,
            3:true,
            4:true,
            5:true,
        },
    },
    "user3": {
        "name": "C",
        "attendance": {
            1:true,
            2:true,
            3:true,
            4:true,
            5:true,
        },
    },
};

router
    // GET req
    .get('/post', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(req.body);
    })
    .get('/get', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(js);
    })

    // POST req
    .post('/post', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(req.body);
    })
    .post('/get', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(js);
    });

module.exports = router;
