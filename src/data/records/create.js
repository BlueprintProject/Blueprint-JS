
(function() {
  var record;

  record = require('./record');

  module.exports = function(model, content) {
    return new record(model, {
      content: content
    });
  };

}).call(this);
