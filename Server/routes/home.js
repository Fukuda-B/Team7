/*
    Team7 server js - home | Update: 2021/05/25
*/

'use strict'
var express = require('express');
var router = express.Router();

router
    // GET req
    .get('/', (req, res) => {
        res.render('home', {title: 'Team7'});
    })

module.exports = router;
