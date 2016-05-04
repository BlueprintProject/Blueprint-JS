
(function() {
  module.exports = (function(alpha) {
    var alphabet, base;
    alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    base = alphabet.length;
    return {
      encodeBigInt: function(enc) {
        var bigBase, bigInt, encoded, remainder, zero;
        bigInt = require('./bigInt');
        zero = bigInt.int2bigInt(0, 10);
        remainder = Array(enc.length);
        bigBase = bigInt.int2bigInt(base, 10);
        encoded = '';
        while (parseInt(bigInt.bigInt2str(enc, 10))) {
          bigInt.divide(enc, bigBase, enc, remainder);
          encoded = alphabet[parseInt(bigInt.bigInt2str(remainder, 10))].toString() + encoded;
        }
        return encoded;
      }
    };
  })();

}).call(this);
