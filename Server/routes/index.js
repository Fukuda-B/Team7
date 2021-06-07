/*
    Team7 server js - index | Update: 2021/05/25
*/

'use strict'
var express = require('express');
var router = express.Router();

router
    // GET req
    .get('/', (req, res) => {
        res.render('index', {
            title: 'Team7',
            top_bar_link: '/main',
            top_bar_text: '<i class="fas fa-sign-in-alt"></i> Sign in'
        });
    })

module.exports = router;
