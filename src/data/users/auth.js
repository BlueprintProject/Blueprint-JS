'use strict';

var Auth = require('../../adapter/auth');
var CurrentUser = require('./current_user');

/**
  * Allows you to authorize your user account
  * @function Blueprint.Authenticate
  * @param data {object} - The login object
  * @returns Promise
  */
var Authenticate = function(data) {
  var promise = Auth.Authenticate(data);

  promise.then(function(user) {
    CurrentUser.setCachedUser(user);
  });

  return promise;
};

/**
  * Restores the existing auth session
  * @function Blueprint.RestoreSession
  * @returns Bool - true if restore was successful
  */
var RestoreSession = function() {
  var result = Auth.RestoreSession();

  if (result) {
    CurrentUser.GetCurrentUser();
  }

  return result;
};

module.exports = {
  Authenticate: Authenticate,
  RestoreSession: RestoreSession
};
