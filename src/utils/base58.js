'use strict';

module.exports = function(alpha) {
  var alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    base = alphabet.length;
  return {
    encodeBigInt: function(enc) {
      var bigInt = require('./bigInt.js');
      var remainder = Array(enc.length);
      var bigBase = bigInt.int2bigInt(base, 10);
      var encoded = '';
      while (parseInt(bigInt.bigInt2str(enc, 10))) {
        bigInt.divide(enc, bigBase, enc, remainder);
        encoded = alphabet[parseInt(bigInt.bigInt2str(remainder, 10))].toString() + encoded;
      }
      return encoded;
    }
  };
}();
