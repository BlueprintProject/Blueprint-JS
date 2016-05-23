'use strict';

var Records = require('./records');
var Groups = require('./groups');
var Users = require('./users');
var Models = require('./models');

/**
 * Used for Interacting With Data
 * @module blueprint/data
 * @private
 */
var Data = {};

Data.Records = {};
Data.Records.Record = Records.Record;
Data.Records.Find = Records.find.Find;
Data.Records.FindOne = Records.find.FindOne;

Data.Groups = {};
Data.Groups.CreateGroup = Groups.CreateGroup;
Data.Groups.PrivateGroup = Groups.PrivateGroup;
Data.Groups.PublicGroup = Groups.PublicGroup;
Data.Groups.GroupWithId = Groups.GroupWithId;
Data.Groups.Group = Groups.Group;

Data.Users = {};

// Existing Sessions
Data.Users.GetCurrentUser = Users.GetCurrentUser;
Data.Users.Logout = Users.Logout;

// Creating Users
Data.Users.Register = Users.Register;
Data.Users.Model = Models;

// Creating Sessions
Data.Users.Authenticate = Users.Authenticate;
Data.Users.RestoreSession = Users.RestoreSession;

Data.Models = {};
Data.Models.Model = Models.Model;

module.exports = Data;
