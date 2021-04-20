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
app.use(compression({
    threshold: 0,
    level: 6,
    memLevel: 6
}));
app.use(logger('dev'));
app.use(passport.initialize());
passport.use(new LocalStrategy(function(username, passport, done){

}))

app.use('/', index);
app.use('/api', api_root);
app.use('/login', login);
