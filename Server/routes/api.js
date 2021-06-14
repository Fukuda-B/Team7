/*
    Team7 server js - api | Update: 2021/06/15
    Our project: https://github.com/Fukuda-B/Team7

    memo:
        API Key: AES({"u":user + "p":pass})

        http://localhost:8080/api/v1/team7?x=de49dd2756ad884762d76453bf624a6438800fcfd79f0dbd295b6a010f5eae9d1cf89de76a1ab2ec4c8bc12c06b25886fcd1093c76111fb166c19759369e375809b26592dd3b37db4b7795b9478bae481e65e02706fd16b046f1f19061f919fe48561f10ed19ebbd7063a87434464012bf98608dbe9337d50c1f10d9ff57a1ff822ae9d2aad536e8a9189e131312ecf43a0cf6efb1b38b2a143d1e8e6bd5f3cd0fd4738fb8b47d5972b61c7a0baa2b4a03a9a220291f6943eef7059a663e144961bd1b76548cccbe77cc07e29c2ce32842d9431f6b2c4bb3fac7b9a79f02ac4bf59061f3a644413a488f3e09cab41ca620ccce7399375129f192ca0c7aee2c4d8716b4c1217a76b5b4b2acff1913273d63b4c39b56fbcd373d6c60ead72729144d4b1258b2837d87774d1119d405e9d1ffd7f5f12980f4855eb42a1d8cf9db8b58fe4086bc68fdd023b1c2d51c762747a78594a0908d4f50ab64bf896cf2df7719af6ea57912b6699049e60d71b9658f0e827a9dbff164ab25f64c54877dab74b490d30980b6879903315097c973965c27772a9f50959eece3acdf355525472fbf43bba3d148efe12ca13367456cfb358c47c256e62bd3c05b9ac5daeba1dd9d97436ee6a226fcee71bbb2b22fd3ed9a57ef722c88b6b0496d09f610c459fb494a991c8aed5d7aa8344fc2d63cd3fd216221ef40c121d2379b6fd3e0ff932e31f60ed836ed5c8dd5be5ea8af30c45f8ba3aef4bd846704ba49d7011cd360c06aec52f75395d9f42de832748460496a2e8a660eeef4ff0789efe82de045daa2143a298eda60476966121cc309a0a542725454d5d37ad3c060366dd609c516ac84a8dd0799f375656db592cd417e79c2728a9b4fe9f4a1acc70bdec7ae19354105fa8e9a0dd483f416d4a0050cdb89fe96a7bae103ed0e09f96f832db733ab2cdeea4572446eec0a7816ccb525f0c98e28fa6f158d9fecd2b73a42f37779cf832cd20a4cf17f585b7212ab4a9363c2ff211bdbbdec4bf8b3e36e9807c8d7746b1429aeaf0208eed45c5b74c4e5ae0381b430c7a292c73447293e4119a9348342c1e9b0fc318a20afeeeb5f4f057e8e04205b107c6b9736ae17ae51c849f0fdf05577e52102fe9f853b42705b4fc4c1353fe23ae482b8267dda8bfeed51cbb7cb601be2f94398aee96d5e06723217bdf350e4d7293ef4e49179ec1797e653956985c337cf891cbcbc46f97ca123220cafe7fd65d82588d698aa9914b509f51871224c23a678df865bf7c1021eb8ae10f12a
*/

'use strict'
const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const hashwasm = require('hash-wasm');

const fs = require('fs');
const path = require('path');
var res_json = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
var userB = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
var bank_api = {
    "iv" : "hello_team7",
    "key": "def08780a8386d1d02e2238d753654cb09dd17739e25af396d1db10817885fda145891fa0fe7ffb634202b8a6f2b05edfc5ac4b8d6550742ec9a4dd0b2ceb3f441d04a09be9df15b4e5ba37fe2a4ee397e14d3f7f1b65d4a5237f19c177ed50fb2d4a9feb66e285e841b06602b85c5d6a2ce391d07a68b603323789d48330baa15aa920ec27a7a7e1e696a32d403685fa7bb113d7732588c3c8bfd1bc7f0b86522f171e051f44a83660bc41e523d98dc1518bcae8ca239daca336a55427a0c14dc3a5c76d93ee548556712f2f003716cafd1be6083feb426a15f213f2d6669e8ed99e865970a043024e3f9a5e561643f110cea2f9f99c5691657c63b1efe55c9",
    "salt": "4e7e77ff4ab30a2ef263c63e903ce4076a3b1feb2afd60266821c928e47d808d224c5a31b1b9a1fb4c39eac0aa14d12031ddf80b10e448b8296de75e22b2c1ce041d778449f2a1b60bb8429ef7fd40d413975a6edac570c0658dffc2b3b57d6e6298862b5997cc917a1fad490bb20ac85331acc9d104b97fa432ede4cd3552fcc6b1fb259a3fd55889ee4eb8c46c262aa63733be22dada12899514eacde996e25350a335221e84a438492b045e54532d05aa998b79b2909768cdc0315e2933099f76dd8158e333a7b73d9ab481844dd8e1a391ba4b17d27969d63edb01655dc41248f9e313b52a6cc7bb992b78ff12a50d6f3e4c27363b7d939d349aa44b08d0",
};

var CRYP = {
        // Encrypto
        encryptoo : function(data, bank) {
            var srcs = CryptoJS.enc.Utf8.parse(data);
            var encrypted = CryptoJS.AES.encrypt(srcs, CryptoJS.enc.Utf8.parse(bank.key), {
                iv: CryptoJS.enc.Utf8.parse(bank.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            return encrypted.ciphertext.toString();
        },
    // Decrypt
    decryptoo : function(data, bank_api) {
        var word = decodeURIComponent(data);
        var encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        var decrypted = CryptoJS.AES.decrypt(srcs, CryptoJS.enc.Utf8.parse(bank_api.key), {
                iv: CryptoJS.enc.Utf8.parse(bank_api.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        // console.log({"rec":data, "hex":encryptedHexStr, "pure":srcs, "decrypted":decrypted, "final":decrypted.toString(CryptoJS.enc.Utf8)});
        var res = decrypted.toString(CryptoJS.enc.Utf8).toString();
        return res;
    },
    // Argon2
    argon2_h : function(data, bank_api) {
        // var salt = bank_api.salt;
        return hashwasm.argon2id({
            password: data,
            salt: bank_api.salt,
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
    .get('/v1/team7', isAuthenticated_nos, function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    })
    .get('/v1/gkey', function (req, res) {
        res.send(get_key(userB));
    })

    // POST req
    .post('/v1/team7', isAuthenticated_nos, function (req, res) {
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send(res_json);
    });

function isAuthenticated_nos(req, res, next) {
    if (check_user(req)) {
        return next();
    } else {
        res.send('bad request');
    }
}

function check_user(req) {
    var userB = JSON.parse(fs.readFileSync('./routes/user_data.json', 'utf8'));
    var dec = CRYP.decryptoo(req.query.x, bank_api);
    var dec_p = JSON.parse(dec);
    // console.log(dec_p);
    return (dec_p.u === userB.username && dec_p.p === userB.password);
}

function get_key(user) {
    return (encodeURIComponent(CRYP.encryptoo('{"u":"'+user.username+'","p":"'+user.password+'"}', bank_api)));
}
module.exports = router;
