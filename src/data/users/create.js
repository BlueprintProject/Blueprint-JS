'use strict';

var User = require('./user');
var Auth = require('../../adapter/auth');
var Utils = require('../../utils');

/**
  * Allows you to create a user account
  * @function Blueprint.Register
  * @param data {object} - The user object
  * @returns Promise
  */
var Register = function(properties) {
  var currentUser = require('./current_user');
  currentUser.Logout();

  var promise = new Utils.promise();
  var user = new User({
    user: properties
  });

  user.save().then(function(user) {
    Auth.setCurrentUser(user.object);
    promise.send(false, user);
  }).fail(function(error) {
    promise.send(error);
  });

  return promise;
};

module.exports = {
  Register: Register
};
