/*
    Team7 server js - cryp module | Update: 2021/06/21
*/
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const hashwasm = require('hash-wasm');
const database = require('./database.js');

var key_size = 2 << 7; // 2<<7=2^8=256, key.length=512
var bank_api = {
  "iv": "hello_team7",
  "key": "def08780a8386d1d02e2238d753654cb09dd17739e25af396d1db10817885fda145891fa0fe7ffb634202b8a6f2b05edfc5ac4b8d6550742ec9a4dd0b2ceb3f441d04a09be9df15b4e5ba37fe2a4ee397e14d3f7f1b65d4a5237f19c177ed50fb2d4a9feb66e285e841b06602b85c5d6a2ce391d07a68b603323789d48330baa15aa920ec27a7a7e1e696a32d403685fa7bb113d7732588c3c8bfd1bc7f0b86522f171e051f44a83660bc41e523d98dc1518bcae8ca239daca336a55427a0c14dc3a5c76d93ee548556712f2f003716cafd1be6083feb426a15f213f2d6669e8ed99e865970a043024e3f9a5e561643f110cea2f9f99c5691657c63b1efe55c9",
  "salt": "4e7e77ff4ab30a2ef263c63e903ce4076a3b1feb2afd60266821c928e47d808d224c5a31b1b9a1fb4c39eac0aa14d12031ddf80b10e448b8296de75e22b2c1ce041d778449f2a1b60bb8429ef7fd40d413975a6edac570c0658dffc2b3b57d6e6298862b5997cc917a1fad490bb20ac85331acc9d104b97fa432ede4cd3552fcc6b1fb259a3fd55889ee4eb8c46c262aa63733be22dada12899514eacde996e25350a335221e84a438492b045e54532d05aa998b79b2909768cdc0315e2933099f76dd8158e333a7b73d9ab481844dd8e1a391ba4b17d27969d63edb01655dc41248f9e313b52a6cc7bb992b78ff12a50d6f3e4c27363b7d939d349aa44b08d0",
};

async function get_key(user) {
  var pass = await database.get_pass(user);
  return (encodeURIComponent(CRYP.encryptoo('{"u":"' + user + '","p":"' + pass + '"}', bank_api)));
}

var CRYP = {
  // Generate key
  key_v_gen: function () {
    return crypto.randomBytes(key_size).toString('hex');
  },
  // Generate iv
  iv_v_gen: function () {
    return crypto.randomBytes(key_size).toString('hex');
  },
  // Generating a encryption key
  // salt is only used for argon2 hasing
  key_gen: function () {
    return {
      "iv": CRYP.iv_v_gen(),
      "key": CRYP.key_v_gen(),
      "salt": "4e7e77ff4ab30a2ef263c63e903ce4076a3b1feb2afd60266821c928e47d808d224c5a31b1b9a1fb4c39eac0aa14d12031ddf80b10e448b8296de75e22b2c1ce041d778449f2a1b60bb8429ef7fd40d413975a6edac570c0658dffc2b3b57d6e6298862b5997cc917a1fad490bb20ac85331acc9d104b97fa432ede4cd3552fcc6b1fb259a3fd55889ee4eb8c46c262aa63733be22dada12899514eacde996e25350a335221e84a438492b045e54532d05aa998b79b2909768cdc0315e2933099f76dd8158e333a7b73d9ab481844dd8e1a391ba4b17d27969d63edb01655dc41248f9e313b52a6cc7bb992b78ff12a50d6f3e4c27363b7d939d349aa44b08d0",
    }
  },
  // Encrypto
  encryptoo: function (data, bank) {
    var srcs = CryptoJS.enc.Utf8.parse(data);
    var encrypted = CryptoJS.AES.encrypt(srcs, CryptoJS.enc.Utf8.parse(bank.key), {
      iv: CryptoJS.enc.Utf8.parse(bank.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString();
  },
  // Decrypt
  decryptoo: function (data, bank_api) {
    var word = decodeURIComponent(data);
    var encryptedHexStr = CryptoJS.enc.Hex.parse(word);
    var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    var decrypted = CryptoJS.AES.decrypt(srcs, CryptoJS.enc.Utf8.parse(bank_api.key), {
      iv: CryptoJS.enc.Utf8.parse(bank_api.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    // console.log({"rec":data, "hex":encryptedHexStr, "pure":srcs, "decrypted":decrypted, "final":decrypted.toString(CryptoJS.enc.Utf8)});
    return decrypted.toString(CryptoJS.enc.Utf8).toString();
  },
  // pure aes decrypt
  decryptoo2: function (data, bank) {
    var srcs = decodeURIComponent(data);
    var decrypted = CryptoJS.AES.decrypt(srcs, CryptoJS.enc.Utf8.parse(bank.key), {
      iv: CryptoJS.enc.Utf8.parse(bank.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8).toString();
  },
  // Argon2
  argon2_h: function (data, bank_api) {
    // var salt = bank_api.salt;
    return hashwasm.argon2id({
      password: data,
      salt: bank_api.salt,
      parallelism: 2,
      iterations: 5,
      memorySize: 1024 * 10, // memory (KB)
      hashLength: 128, // byte
      outputType: 'encoded',
    });
  },
}

exports.CRYP = CRYP;
exports.bank_api = bank_api;
exports.get_key = get_key;