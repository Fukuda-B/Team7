var express = require('express');
var router = express.Router();
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

router.post('/', (req, res) => {
  req.session.passport.user = undefined;
  res.redirect('/');
});

module.exports = router;
