
(function() {
  var group;

  group = require('./group');

  module.exports = function(properties) {
    return new group(properties);
  };

}).call(this);
