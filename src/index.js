'use strict';

var Data = require('./data');
var Config = require('./config');
var Utils = require('./utils');
/**
 * Main Entrypoint for Blueprint
 * @namespace
 */
var Blueprint = {};

Blueprint.init = Config.Init;

// Groups
Blueprint.publicGroup = Data.Groups.PublicGroup;
Blueprint.privateGroup = Data.Groups.PrivateGroup;
Blueprint.createGroup = Data.Groups.CreateGroup;
Blueprint.groupWithId = Data.Groups.GroupWithId;
Blueprint.Group = Data.Groups.Group;
// Data

/**
 * Used for interacting with records that do not have a model
 * @namespace
 */
Blueprint.Data = {};

Blueprint.Data.Record = Data.Records.Record;
Blueprint.Data.find = Data.Records.Find;
Blueprint.Data.findOne = Data.Records.FindOne;

Blueprint.Model = Data.Models.Model;

// User
Blueprint.getCurrentUser = Data.Users.GetCurrentUser;
Blueprint.register = Data.Users.Register;

// Sessions
Blueprint.authenticate = Data.Users.Authenticate;
Blueprint.restoreSession = Data.Users.RestoreSession;
Blueprint.logout = Data.Users.Logout;

Blueprint.Promise = Utils.promise;

if (typeof window !== 'undefined') {

  var hasModule = typeof module !== 'undefined';

  if (hasModule) {
    hasModule = typeof module.exports !== 'undefined';
  }

  if (window.Blueprint !== false || !hasModule) {
    window.Blueprint = Blueprint;
  } else {
    module.exports = Blueprint;
  }
} else {
  module.exports = Blueprint;
}
