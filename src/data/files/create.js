var file = require('./file.js')

module.exports = function(properties, record, data) {
  return new file(properties, record, data)
}
