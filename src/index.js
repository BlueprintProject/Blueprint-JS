
(function() {
  var Adapter, Blueprint, Config, Data;

  Data = require('./data');

  Adapter = require('./adapter');

  Config = require('./config');

  // Base Structure
  Blueprint = {};
  Blueprint.Data = {};


  Blueprint.Init = Config.init;

  // Groups
  Blueprint.PublicGroup = Data.PublicGroup;
  Blueprint.PrivateGroup = Data.PublicGroup;
  Blueprint.CreateGroup = Data.CreateGroup;
  Blueprint.GroupWithId = Data.GroupWithId;

  // Data
  Blueprint.Data.CreateRecord = Data.CreateRecord;
  Blueprint.Data.Find = Data.Find;
  Blueprint.Data.FindOne = Data.FindOne;

  // Models
  Blueprint.Model = Data.Model;

  // User
  Blueprint.CurrentUser = Data.CurrentUser;
  Blueprint.Register = Data.Register;

  // Sessions
  Blueprint.Authenticate = Adapter.Auth.Authenticate;
  Blueprint.RestoreSession = Adapter.Auth.RestoreSession;
  Blueprint.Logout = Adapter.Auth.Logout;

  Blueprint.setCurrentUser = Adapter.Auth.setCurrentUser;

  if (typeof window !== 'undefined') {
    if (typeof window.Blueprint === 'undefined') {
      window.Blueprint = Blueprint;
    } else {
      module.exports = Blueprint;
    }
  } else {
    module.exports = Blueprint;
  }

}).call(this);
