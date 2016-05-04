
(function() {
  var createUser, Register, session, user, utils;

  user = require('./user');

  session = require('../../adapter');

  utils = require('../../utils');

  createUser = function(properties) {
    return new user(properties);
  };

  Register = function(properties) {
    var user;
    var promise;
    promise = new utils.promise;
    user = createUser({
      user: properties
    });
    user.save().then(function(error, user) {
      if (!error) {
        adapter.Auth.setCurrentUser(user._object);
      }
      return promise.send(error, user);
    });
    return promise;
  };

  module.exports = {
    createUser: createUser,
    Register: Register
  };

}).call(this);
