
(function() {
  var file;

  file = require('./file');

  module.exports = function(properties, record, data) {
    return new file(properties, record, data);
  };

}).call(this);
