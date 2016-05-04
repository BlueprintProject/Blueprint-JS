
(function() {
  var config, extend, init;

  extend = require('./utils/extend');

  config = {
    host: 'localhost',
    protocol: 'http',
    port: 8080,
    application_id: '000000000000000000000001'
  };

  module.exports.config = config;

  init = function(config) {
    return config = extend(module.exports.config, config);
  };

  module.exports.init = init;

  module.exports.get = function(key) {
    return module.exports.config[key];
  };

}).call(this);
