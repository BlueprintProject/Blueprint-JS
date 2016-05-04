
(function() {
  var Create, CurrentUser, Find;

  Create = require('./create');

  CurrentUser = require('./current_user');

  Find = require('./find');

  module.exports = {
    createUser: Create.createUser,
    Register: Create.Register,
    CurrentUser: CurrentUser,
    findUserById: Find
  };

}).call(this);
