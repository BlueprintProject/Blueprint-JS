var record = require("../records/record.js")

var user = record.extend(function(data) {
  this.__is_blueprint_object = true

  this._endpoint = "users"
  this._object = data

  return this
})

user.prototype.get = function(key) {
  return this._object[key]
}

module.exports = user