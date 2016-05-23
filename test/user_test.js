'use strict';

var handleError = function(error) {
  throw Error(JSON.stringify(error));
};

describe('Users', function() {
  var prefix;
  prefix = Date.now().toString();

  before(function() {
    return Blueprint.Init({
      applicationId: '000000000000000000000001',
      port: 8080
    });
  });

  var email = prefix + '@test.goblueprint.co';
  var password = '1234567890a';

  it('Can Create User', function(done) {

    Blueprint.Register({
      email: email,
      password: password,
      name: prefix + ' Test User'
    }).then(function(user) {

      if (user) {
        done();
      } else {
        throw 'No User Returned';
      }

    }).fail(handleError);

  });

  it('Can Get Current User', function(done) {

    Blueprint.GetCurrentUser().then(function(user) {

      if (user) {
        done();
      } else {
        throw 'No User Returned';
      }

    }).fail(handleError);

  });

  it('Can Logout', function(done) {
    Blueprint.Logout();

    Blueprint.GetCurrentUser().then(function() {
      throw Error('Still Logged In');
    }).fail(function() {
      done();
    });

  });

  it('Can Authenticate', function(done) {
    Blueprint.Authenticate({
      email: email,
      password: password
    }).then(function() {
      done();
    }).fail(handleError);
  });

  it('Can Destory', function(done) {
    Blueprint.GetCurrentUser().then(function(currentUser) {
      currentUser.destroy().then(function() {
        done();
      }).fail(handleError);
    }).fail(handleError);
  });

});
