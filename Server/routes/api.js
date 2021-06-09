/*
    Team7 server js - api | Update: 2021/06/08
    Our project: https://github.com/Fukuda-B/Team7
*/

'use strict'
const express = require('express');
const router = express.Router();
const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

const fs = require('fs');
var res_json = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));

// Passport
passport.use(new LocalStrategy ({
    usernameField: "u",
    passwordField: "p",
    session: false,
}, (username, passwrod, done) => {
    if (check_user(username, passwrod)) {
        return done(null, username);
    } else {
        return done(null, false);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

router
    // GET req
    .get('/', isAuthenticated, function (req, res) {
        console.log(req.body);
        res.send('team7 - api');
        console.log(req);
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

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } else {
        res.send('bad request');
    }
}
function check_user() {
    return false;
}

module.exports = router;
