/*
    Team7 server js | Update: 2021/05/25
    Our project: https://github.com/Fukuda-B/Team7

    Memo:
    npm install --save []
---
    Authentication middleware: [passport](https://github.com/jaredhanson/passport])
    Template engine: [ejs](https://ejs.co/)
*/

'use strict'
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var cookieSettion = require('cookie-session');
var ejs = require('ejs');
var byrypt = require('bcrypt');
var express = require('express');
var compression = require('compression');
var morgan = require('morgan');
var path = require('path')
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

// -----
// Router module
var index = require('./routes/index');
var login = require('./routes/login');
var home = require('./routes/home');
var api_root = require('./routes/api');
var listenPort = 3000;

// -----
var app = express();

// Gzip complession
app.use(compression({
    threshold: 0,
    level: 7,
    memLevel: 7
}));

// Cookie settings
/*
app.use(
    cookieSettion({
        name: [userName],
        keys: [passWord],
        maxAge: 12*60*60*1000,
    })
);
*/

// Engine & Req Middle
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '/public')));
/*
app.use(passport.initialize());
passport.use(new LocalStrategy({
    usernameFil: "username",
    passwordFil: "password",
}, funciton(username, password, done) {
}));
passport.use(new LocalStrategy(function(username, passport, done){
}))
*/

app.use(morgan('dev'));
app.use(cookieParser());

// Router setting
app.use('/', index);
app.use('/home', home);
app.use('/login', login);
app.use('/api/v1/team7', api_root);

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') == 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error', {title: 'Server Error'});
});

app.listen(listenPort, () => {
    console.log('Welcome to Team7!')
})
