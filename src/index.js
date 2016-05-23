'use strict';

var Data = require('./data');
var Config = require('./config');

/**
 * Main Entrypoint for Blueprint
 * @namespace
 */
var Blueprint = {};

Blueprint.Init = Config.Init;

// Groups
Blueprint.PublicGroup = Data.Groups.PublicGroup;
Blueprint.PrivateGroup = Data.Groups.PrivateGroup;
Blueprint.CreateGroup = Data.Groups.CreateGroup;
Blueprint.GroupWithId = Data.Groups.GroupWithId;
Blueprint.Group = Data.Groups.Group;
// Data

/**
 * Used for interacting with records that do not have a model
 * @namespace
 */
Blueprint.Data = {};

Blueprint.Data.Record = Data.Records.Record;
Blueprint.Data.Find = Data.Records.Find;
Blueprint.Data.FindOne = Data.Records.FindOne;

Blueprint.Model = Data.Models.Model;

// User
Blueprint.GetCurrentUser = Data.Users.GetCurrentUser;
Blueprint.Register = Data.Users.Register;

// Sessions
Blueprint.Authenticate = Data.Users.Authenticate;
Blueprint.RestoreSession = Data.Users.RestoreSession;
Blueprint.Logout = Data.Users.Logout;

if (typeof window !== 'undefined') {
  if (typeof window.Blueprint === 'undefined') {
    window.Blueprint = Blueprint;
  } else {
    module.exports = Blueprint;
  }
} else {
  module.exports = Blueprint;
}
