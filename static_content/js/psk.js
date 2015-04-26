function getWpaPskKeyFromPassphrase(pass, salt) {

  /* pad string to 64 bytes and convert to 16 32-bit words */
  function stringtowords(s, padi) {
    /* return a 80-word array for later use in the SHA1 code */
    var z = new Array(80);
    var j = -1, k = 0;
    var n = s.length;
    for (var i = 0; i < 64; i++) {
      var c = 0;
      if (i < n) {
        c = s.charCodeAt(i);
      } else if (padi) {
        /* add 4-byte PBKDF2 block index and
	   standard padding for the final SHA1 input block */
	if (i == n) c = (padi >>> 24) & 0xff;
	else if (i == n + 1) c = (padi >>> 16) & 0xff;
	else if (i == n + 2) c = (padi >>> 8) & 0xff;
	else if (i == n + 3) c = padi & 0xff;
	else if (i == n + 4) c = 0x80;
      }
      if (k == 0) { j++; z[j] = 0; k = 32; }
      k -= 8;
      z[j] = z[j] | (c << k);
    }
    if (padi) z[15] = 8 * (64 + n + 4);
    return z;
  }

  /* compute the intermediate SHA1 state after processing just
     the 64-byte padded HMAC key */
  function initsha(w, padbyte) {
    var pw = (padbyte << 24) | (padbyte << 16) | (padbyte << 8) | padbyte;
    for (var t = 0; t < 16; t++) w[t] ^= pw;
    var s = [ 0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0 ];
    var a = s[0], b = s[1], c = s[2], d = s[3], e = s[4];
    var t;
    for (var k = 16; k < 80; k++) {
      t = w[k-3] ^ w[k-8] ^ w[k-14] ^ w[k-16];
      w[k] = (t<<1) | (t>>>31);
    }
    for (var k = 0; k < 20; k++) {
      t = ((a<<5) | (a>>>27)) + e + w[k] + 0x5A827999 + ((b&c)|((~b)&d));
      e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
    }
    for (var k = 20; k < 40; k++) {
      t = ((a<<5) | (a>>>27)) + e + w[k] + 0x6ED9EBA1 + (b^c^d);
      e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
    }
    for (var k = 40; k < 60; k++) {
      t = ((a<<5) | (a>>>27)) + e + w[k] + 0x8F1BBCDC + ((b&c)|(b&d)|(c&d));
      e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
    }
    for (var k = 60; k < 80; k++) {
      t = ((a<<5) | (a>>>27)) + e + w[k] + 0xCA62C1D6 + (b^c^d);
      e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
    }
    s[0] = (s[0] + a) & 0xffffffff;
    s[1] = (s[1] + b) & 0xffffffff;
    s[2] = (s[2] + c) & 0xffffffff;
    s[3] = (s[3] + d) & 0xffffffff;
    s[4] = (s[4] + e) & 0xffffffff;
    return s;
  }

  /* compute the intermediate SHA1 state of the inner and outer parts
     of the HMAC algorithm after processing the padded HMAC key */
  var hmac_istate = initsha(stringtowords(pass, 0), 0x36);
  var hmac_ostate = initsha(stringtowords(pass, 0), 0x5c);

  /* output is created in blocks of 20 bytes at a time and collected
     in a string as hexadecimal digits */
  var hash = '';
  var i = 0;
  while (hash.length < 64) {
    /* prepare 20-byte (5-word) output vector */
    var u = [ 0, 0, 0, 0, 0 ];
    /* prepare input vector for the first SHA1 update (salt + block number) */
    i++;
    var w = stringtowords(salt, i);
    /* iterate 4096 times an inner and an outer SHA1 operation */
    for (var j = 0; j < 2 * 4096; j++) {
      /* alternate inner and outer SHA1 operations */
      var s = (j & 1) ? hmac_ostate : hmac_istate;
      /* inline the SHA1 update operation */
      var a = s[0], b = s[1], c = s[2], d = s[3], e = s[4];
      var t;
      for (var k = 16; k < 80; k++) {
        t = w[k-3] ^ w[k-8] ^ w[k-14] ^ w[k-16];
        w[k] = (t<<1) | (t>>>31);
      }
      for (var k = 0; k < 20; k++) {
        t = ((a<<5) | (a>>>27)) + e + w[k] + 0x5A827999 + ((b&c)|((~b)&d));
        e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
      }
      for (var k = 20; k < 40; k++) {
        t = ((a<<5) | (a>>>27)) + e + w[k] + 0x6ED9EBA1 + (b^c^d);
        e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
      }
      for (var k = 40; k < 60; k++) {
        t = ((a<<5) | (a>>>27)) + e + w[k] + 0x8F1BBCDC + ((b&c)|(b&d)|(c&d));
        e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
      }
      for (var k = 60; k < 80; k++) {
        t = ((a<<5) | (a>>>27)) + e + w[k] + 0xCA62C1D6 + (b^c^d);
        e = d; d = c; c = (b<<30) | (b>>>2); b = a; a = t & 0xffffffff;
      }
      /* stuff the SHA1 output back into the input vector */
      w[0] = (s[0] + a) & 0xffffffff;
      w[1] = (s[1] + b) & 0xffffffff;
      w[2] = (s[2] + c) & 0xffffffff;
      w[3] = (s[3] + d) & 0xffffffff;
      w[4] = (s[4] + e) & 0xffffffff;
      if (j & 1) {
        /* XOR the result of each complete HMAC-SHA1 operation into u */
	u[0] ^= w[0]; u[1] ^= w[1]; u[2] ^= w[2]; u[3] ^= w[3]; u[4] ^= w[4];
      } else if (j == 0) {
        /* pad the new 20-byte input vector for subsequent SHA1 operations */
	w[5] = 0x80000000;
	for (var k = 6; k < 15; k++) w[k] = 0;
	w[15] = 8 * (64 + 20);
      }
    }
    /* convert output vector u to hex and append to output string */
    for (var j = 0; j < 5; j++)
      for (var k = 0; k < 8; k++) {
        var t = (u[j] >>> (28 - 4 * k)) & 0x0f;
	hash += (t < 10) ? t : String.fromCharCode(87 + t);
      }
  }

  /* return the first 32 key bytes as a hexadecimal string */
  return hash.substring(0, 64);
}

function fcalc(pass,ssid) {
  var hash = getWpaPskKeyFromPassphrase(pass, ssid);
  return hash;
}
