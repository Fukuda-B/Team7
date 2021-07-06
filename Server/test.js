var CryptoJS = require('crypto-js');

var key = CryptoJS.enc.Utf8.parse('bbb');
var iv = CryptoJS.enc.Utf8.parse('bbbbbb');

function Encrypt(word) {
  srcs = CryptoJS.enc.Utf8.parse(word);
  var encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString();
}

function Decrypt(word) {
  var encryptedHexStr = CryptoJS.enc.Hex.parse(word);
  var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
  var decrypt = CryptoJS.AES.decrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
  console.log(encryptedHexStr);
  console.log(srcs);
  return decryptedStr.toString();
}

var origin = 'ababa-';
console.log(origin);
var mm = Encrypt(origin);
console.log(mm);

var jm = Decrypt(mm);
console.log(jm)