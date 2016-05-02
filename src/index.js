Data = require("./data")
Adapter = require("./adapter")
Config = require("./config.js")

var Blueprint = {}

// Config
Blueprint.Init = Config.init;
//Blueprint.Config = Config.config;

// Groups
Blueprint.getPublicGroup = Data.getPublicGroup;
Blueprint.getPrivateGroup = Data.getPrivateGroup;
Blueprint.createGroup = Data.createGroup;
Blueprint.groupWithId = Data.groupWithId;

// Data
Blueprint.createRecord = Data.createRecord;
Blueprint.findRecords = Data.findRecords;
Blueprint.findRecord = Data.findRecord;
Blueprint.record = Data.record;

Blueprint.model = Data.model

// Users
Blueprint.getCurrentUser = Data.getCurrentUser;

// Custom Endpoints
Blueprint.performEndpoint = Data.performEndpoint;


Blueprint.Register = Data.registerUser;
Blueprint.Authenticate = Adapter.auth.authenticate;
Blueprint.Logout = Adapter.auth.logout;
Blueprint.RestoreSession = Adapter.auth.restoreSession;

Blueprint.Adapter = Adapter;

Blueprint.setCurrentUser = Adapter.auth.setCurrentUser;

Blueprint.__utilities = require("./utils")

if (typeof window !== 'undefined') {
  if(typeof window.Blueprint === 'undefined') {
    window.Blueprint = Blueprint;
  } else {
    module.exports = Blueprint;
  }
} else {
  module.exports = Blueprint;
}
