
(function() {
  var CustomEndpoints, Data, Files, Groups, Records, Users;

  Records = require('./records');

  Groups = require('./groups');

  Users = require('./users');

  Files = require('./files');

  Data = {};

  Data.CreateRecord = Records.create;

  Data.Find = Records.find.Find;

  Data.FindOne = Records.find.FindOne;

  Data.record = Records.record;

  Data.CreateGroup = Groups.CreateGroup;

  Data.PublicGroup = Groups.PublicGroup;

  Data.PublicGroup = Groups.PublicGroup;

  Data.GroupWithId = Groups.GroupWithId;

  Data.CurrentUser = Users.CurrentUser;

  Data.Register = Users.Register;

  Data.Model = require('./models');

  module.exports = Data;

}).call(this);
