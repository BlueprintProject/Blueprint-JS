var record = require('./record.js')

module.exports = function(model, content) {
  return new record(model, {content:content})
}
