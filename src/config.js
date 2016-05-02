var extend = require('./utils/extend.js')

var config = {
  host: "localhost",
  protocol: "http",
  port: 8080,
  application_id: "5543850719b6366c23000001"
}

module.exports.config = config

var init = function(config) {
  config = extend(module.exports.config, config)
}

module.exports.init = init
module.exports.get = function(key) {
  return module.exports.config[key]
}
