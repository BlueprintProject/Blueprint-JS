'use strict';

var Adapter = require('../../adapter');
var Utils = require('../../utils');

var Session = require('../../session');

var cachedUser;
var cachedUserLoaded;
var currentUserPromise;

var setCachedUser = function(currentUserData) {
  var User = require('./user');

  cachedUser = new User(currentUserData);
  Session.set('cached_user', currentUserData);
};


/**
  * Allows you to retrive the current user object
  * @function Blueprint.GetCurrentUser
  * @returns Blueprint.User
  */

var GetCurrentUser = function(noCache) {
  // If there is already a cached user object
  // and we're not disabling the cache
  if(cachedUser && !noCache) {
    var promise = new Utils.promise();
    promise.send(false, cachedUser);
    return promise;
  // If there is cached user being loaded
  // and we're not disabling the cache
  } else if (currentUserPromise && !noCache) {
    return currentUserPromise;
  // Otherwise, we need to load the user object
  // from the session or from the server
  }

  // Lets create our global promise so we don't hit the server unneedingly
  currentUserPromise = new Utils.promise();

  // Attempt to determine if we have a cached user in the session
  // if allowed
  var sessionCachedUser = Session.get('cached_user');

  // We do have a cached user, lets set it and send it
  if(typeof sessionCachedUser !== 'undefined' && !noCache) {
    setCachedUser(sessionCachedUser);

    currentUserPromise.send(false, cachedUser);

  // We do not have a cached user or we can't use it
  // lets get it from the server
  } else {
    Adapter.Auth.CurrentUser(function(currentUserData) {
      if (currentUserData) {
        setCachedUser(currentUserData);
        return currentUserPromise.send(false, cachedUser);
      }

      // There has been an error, error out
      return currentUserPromise.send(true);
    });
  }

  // Return the promise
  return currentUserPromise;
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
