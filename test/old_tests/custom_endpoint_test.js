
(function() {
  var Blueprint;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  describe('Custom Endpoint', function() {
    var file, prefix, record, user_b;
    prefix = Date.now().toString();
    user_b = void 0;
    record = void 0;
    file = void 0;
    before(function(done) {
      Blueprint.Init({
        application_id: '5543850719b6366c23000001',
        port: 8080
      });
      return Blueprint.Register({
        email: prefix + '_c@test.goblueprint.co',
        password: '1234567890a',
        name: prefix + ' Test User C'
      }).then(function(error, user) {
        return done();
      });
    });
    return it('Can Run Custom Endpoint', function(done) {
      return Blueprint.performEndpoint('example', {
        testing: true
      }).then(function(error, response) {
        if (!error) {
          return done();
        }
      });
    });
  });

}).call(this);
