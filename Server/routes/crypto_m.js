var CRYPTOS = {
    /*
        Team7 will use ECDH P-521 for key generation and AES256 for encryption. (2021/05/29)
        When using multiple algorithms, the cipher strength depends on the one with lower cipher strength.
        In this case, ECDH has a lower strength. (Strength with the same key length: ECDH < AES)
        So, ECDH requires a key length of 512 bits or more to match the 256 bits of AES.

        crypto.subtle.generateKey(algorithm, exportable, usage)
    */
    KEY_GEN : function() {
        var crypto_v = {
            name: "ECDH",
            namedCurve: "P-521"
        }
        var crypto_u = ["deriverKey"];
        return crypto.subtle.generateKey(crypto_v, false, crypto_u);
    },
    // Generating a common key
    KEY_GEN_C : function(iv) {
        var gkey = CRYPTOS.KEY_GEN();
        var aes = {
            name: "ARS-GCM",
            length: 256
        };
        var ecdh = {
            name: "ECDH",
            public: gkey.publickey
        };
        var crypto_u = ["encrypt", "decrypt"];
        return {
            "iv": iv,
            "key": gkey,
            "publickey": crypto.subtle.deriveKey(ecdh, gkey.publickey, aes, false, crypto_u),
        };
    },
    // Decrypto from AES
    DECRYPTO : function(bank, val) {
        var key = bank.gkey.publickey;
        var iv = bank.iv;
        var encryptedHexStr = cryptojs.enc.Hex.parse(val);
        var srcs = cryptojs.enc.Base64.stringify(encryptedHexStr);
        var decrypt = cryptojs.AES.decrypt(srcs, key, { iv: iv, mode: cryptojs.mode.CBC, padding: cryptojs.pad.Pkcs7 });
        var decryptedStr = decrypt.toString(cryptojs.enc.Utf8);
        return decryptedStr.toString();
            // var aes = {
            //     name: "AES-GCM",
            //     iv: val.subarray(0, 16),
            //     tagLength: 256
            // };
        // return new Uint8Array(await crypto.subtle.decrypto(aes, key , val.subarray(16)));
        // return
    },
}
