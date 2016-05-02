var user = require('./user.js')
var session = require("../../adapter")
var utils = require("../../utils")

var createUser = function(properties) {
  return new user(properties)
}

var registerUser = function(properties) {
  var promise = new utils.promise
  var user = createUser({user:properties})
  user.save().then(function(error, user) {
    if(!error) {
      adapter.auth.setCurrentUser(user._object)
    }
    promise.send(error, user)
  })

  return promise
}

module.exports = {
    createUser: createUser,
    registerUser: registerUser
}
