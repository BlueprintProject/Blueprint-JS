
(function() {
  var Blueprint;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  describe('Utilities', function() {
    return it('Can Run Empty Promise', function(done) {
      var promise;
      promise = new Blueprint.__utilities.promise;
      promise.send();
      return done();
    });
  });

}).call(this);
