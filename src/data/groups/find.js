
(function() {
  var config, group, session;

  session = require('../../session');

  config = require('../../config');

  group = require('./group');

  module.exports.PublicGroup = function() {
    return new group({
      id: session.get('user_id')
    });
  };

  module.exports.PublicGroup = function() {
    return new group({
      id: config.get('application_id')
    });
  };

  module.exports.GroupWithId = function(id) {
    return new group({
      id: id
    });
  };

}).call(this);
