'use strict';

var Adapter = require('../../adapter');
var Utils = require('../../utils');

var cachedUser;
var cachedUserLoaded;

var setCachedUser = function(currentUserData) {
  var User = require('./user');
  cachedUser = new User(currentUserData);
  cachedUserLoaded = true;
};


/**
  * Allows you to retrive the current user object
  * @function Blueprint.GetCurrentUser
  * @returns Blueprint.User
  */

var GetCurrentUser = function() {
  var promise = new Utils.promise();

  if (cachedUserLoaded) {
    promise.send(false, cachedUser);
  } else {
    Adapter.Auth.CurrentUser(function(currentUserData) {
      if (currentUserData) {
        setCachedUser(currentUserData);
        return promise.send(false, cachedUser);
      } else {
        return promise.send(true);
      }
    });
  }

  return promise;
};

/**
  * Destroys the auth session
  * @function Blueprint.Logout
  */

var Logout = function() {
  cachedUser = undefined;
  cachedUserLoaded = false;

  Adapter.Auth.Logout();
};

module.exports = {
  GetCurrentUser: GetCurrentUser,
  Logout: Logout,

  setCachedUser: setCachedUser
};
