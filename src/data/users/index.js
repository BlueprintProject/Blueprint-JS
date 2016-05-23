'use strict';

var Create = require('./create');
var CurrentUser = require('./current_user');
var Find = require('./find');
var Auth = require('./auth');
var User = require('./user');

module.exports = {
  // Create
  User: User,
  Register: Create.Register,

  // Existing
  GetCurrentUser: CurrentUser.GetCurrentUser,
  Logout: CurrentUser.Logout,

  // Create Sessions
  Authenticate: Auth.Authenticate,
  RestoreSession: Auth.RestoreSession,

  FindUserById: Find
};
