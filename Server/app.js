/*
    Team7 server js | Update: 2021/06/02
    Our project: https://github.com/Fukuda-B/Team7

    Memo:
    npm install --save []

    ---
    https://qiita.com/tarotaro1129/items/71fd835314a108834b5a
    https://www.guru99.com/web-security-vulnerabilities.html
    https://www.whitehatsec.com/faq/content/top-vulnerabilities-list
    https://github.com/OWASP/Top10
    https://wiki.owasp.org/images/2/23/OWASP_Top_10-2017%28ja%29.pdf

    OS Command Injection
    SQL-injection
    Directory traversal
    Session hijacking
    Cross-site scripting (XSS)
    Cross-site request forgery (CSRF)
    http header-injection
    Clickjacking
    Broken Authentication and Session Management
    Insecure Direct Object References
    Security Misconfiguration
    Insecure Cryptographic Storage
    Failure to restrict URL Access
    Insufficient Transport Layer Protection
    Unvalidated Redirects and Forwards
    Session fixation

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
var session = require('express-session');
// var compression = require('compression');
var morgan = require('morgan');
var path = require('path')
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

// -----
// Router module
var index = require('./routes/index');
var main = require('./routes/main');
var api_root = require('./routes/api');
var listenPort = 3000;

// -----
process.on('uncaughtException', (err) => {
    console.error(err);
});

var app = express();

// Gzip complession
// app.use(compression({
//     threshold: 0,
//     level: 7,
//     memLevel: 7
// }));

// Cookie settings
var expiryDate = new Date(Date.now() + 24*60*60*1000); // 1day
app.use(session({
    secret: 'hello_team7',
    resave: true,
    saveUninitialized: false,
    cookie: {
        // secure: true,
        httpOnly: true,
        expires: expiryDate,
    }
}));

// Engine & Req Middle
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '/public')));

app.use(passport.initialize());

app.use(morgan('dev')); // logger
app.use(cookieParser());
app.disable('x-powered-by'); // disable header

// Router setting
app.use('/', index);
app.use('/main', main);
app.use('/api/v1/team7', api_root);

// 404 Not Found
app.use(function(req, res, next) {
    next(createError(404));
});

// 500 Internal Server Error
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') == 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error', {title: 'Server Error'});
});

// Listen port
app.listen(listenPort, () => {
    console.log('Welcome to Team7!')
})
