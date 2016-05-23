
(function() {
  var Blueprint,
    current_user;

  if (typeof Blueprint === 'undefined') {
    Blueprint = require('../src');
  }

  current_user = void 0;

  describe('Users', function() {
    var prefix;
    prefix = Date.now().toString();
    before(function() {
      return Blueprint.Init({
        application_id: '5543850719b6366c23000001',
        port: 8080
      });
    });
    it('Can Create User', function(done) {
      return Blueprint.Register({
        email: prefix + '@test.goblueprint.co',
        password: '1234567890a',
        name: prefix + ' Test User'
      }).then(function(error, user) {
        if (error) {
          throw new Error('Server ed Error');
        } else {
          if (typeof user.get('id') === 'undefined') {
            throw new Error('User does not have an ID');
          }
        }
        return Blueprint.getCurrentUser().then(function(error, user) {
          current_user = user;
          return done();
        });
      });
    });
    it('Can Authenticate as User', function(done) {
      return Blueprint.Authenticate({
        email: prefix + '@test.goblueprint.co',
        password: '1234567890a'
      }).then(function(error) {
        if (error) {
          throw new Error('Server ed Error');
        } else {
          if (typeof current_user.get('id') === 'undefined') {
            throw new Error('User does not have an ID');
          }
        }
        return done();
      });
    });
    it('Can Delete User', function(done) {
      return current_user["delete"]().then(function(error) {
        if (error) {
          throw new Error('Server ed Error');
        }
        return done();
      });
    });
    it('Can Restore User Session', function(done) {
      if (!Blueprint.RestoreSession()) {
        throw new Error('Could not restore session');
      }
      return done();
    });
    return it('Can Logout User', function(done) {
      Blueprint.Logout();
      return done();
    });
  });

}).call(this);
