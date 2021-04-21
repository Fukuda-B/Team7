var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var cookieSettion = require('coolie-session');
var pug = require('pug');
var byrypt = require('bcrypt');
var express = require('express');
var compression = require('compression');
var logger = require('morgan');
var path = require('path')
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

// -----

var index = require('./routes/index');
var api_root = require('./routes/api');
var login = require('./routes/login');

// -----
var app = express();

// Gzip complession
app.use(compression({
    threshold: 0,
    level: 6,
    memLevel: 6
}));

// Cookie settings
app.use(
    cookieSettion({
        name: [userName],
        keys: [passWord],
        maxAge: 12*60*60*1000,
    })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
passport.use(new LocalStrategy({
    usernameFil: "username",
    passwordFil: "password",
}, funciton(username, password, done) {
}));
passport.use(new LocalStrategy(function(username, passport, done){

}))
app.use(logger('dev'));
app.use(cookieParser());

app.use('/', index);
app.use('/api', api_root);
app.use('/login', login);

app.user(function(req, res, next) {
    next(createError(404));
});

app.user(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') == 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;
