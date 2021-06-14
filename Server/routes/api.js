/*
    Team7 server js - api | Update: 2021/06/10
    Our project: https://github.com/Fukuda-B/Team7
*/

'use strict'
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const hashwasm = require('hash-wasm');

const fs = require('fs');
const path = require('path');
var res_json = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
var userB = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
var bank = {
    "iv" : "hello_team7",
    "key": "def08780a8386d1d02e2238d753654cb09dd17739e25af396d1db10817885fda145891fa0fe7ffb634202b8a6f2b05edfc5ac4b8d6550742ec9a4dd0b2ceb3f441d04a09be9df15b4e5ba37fe2a4ee397e14d3f7f1b65d4a5237f19c177ed50fb2d4a9feb66e285e841b06602b85c5d6a2ce391d07a68b603323789d48330baa15aa920ec27a7a7e1e696a32d403685fa7bb113d7732588c3c8bfd1bc7f0b86522f171e051f44a83660bc41e523d98dc1518bcae8ca239daca336a55427a0c14dc3a5c76d93ee548556712f2f003716cafd1be6083feb426a15f213f2d6669e8ed99e865970a043024e3f9a5e561643f110cea2f9f99c5691657c63b1efe55c9"
};

var CRYP = {
    // Encrypto
    encryptoo : function(data, bank) {
        var srcs = CryptoJS.enc.Utf8.parse(data);
        var encrypted = CryptoJS.AES.encrypt(srcs, bank.key, {
            iv: bank.iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted;
    },
    // Argon2
    argon2_h : function(data, bank) {
        // var salt = bank.salt;
        return hashwasm.argon2id({
            password: data,
            salt: bank.salt,
            parallelism: 2,
            iterations: 5,
            memorySize: 1024*10, // memory (KB)
            hashLength: 128, // byte
            outputType: 'encoded',
        });
    },
}

router
    // GET req
    .get('/', isAuthenticated_nos, function (req, res) {
    // .get('/', function (req, res) {
        res.send('team7 - api');
    })
    .get('/v1/team7', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    })
    .get('/v1/gkey', function (req, res) {
        res.send(get_key(userB));
    })

    // POST req
    .post('/v1/team7', function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    });

function isAuthenticated_nos(req, res, next) {
    if (req.body.length>0 && check_user(req.body.u, req.body.p)) {
        return next();
    } else {
        res.send('bad request');
    }
}

function check_user(req) {
    var userB = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
    return (req.body.u === userB.username && req.body.p === userB.password);
}

function get_key(user) {
    return (encodeURIComponent(CRYP.encryptoo('{"u":"'+user.username+'","p":"'+CRYP.argon2_h(user.password, bank)+'"'), bank));
}
module.exports = router;
