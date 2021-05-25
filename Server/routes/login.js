/*
    Team7 server js - login | Update: 2021/05/25
*/

var express = require('express');
var passport = require('passport');
var router = express.Router();

router
    // GET req
    .get('/', function(req, res, next) {
        res.render('login', {title: 'Team7 | Login'});
    });

// -----

const userB = {
    username: "B",
    password: "Why_B_is_GOD?"
};

// -----

module.exports = router;
