var auth = require("../../adapter/auth.js")
var create = require("./create.js")
var utils = require('../../utils')

var current_user = undefined

module.exports = function() {
  var promise = new utils.promise

  if(typeof current_user === "undefined") {
    auth.getCurrentUser(function(current_user_data) {
      if(current_user_data == false) {
        //console.log("This is a test")
        promise.send(true)
      } else {
        current_user = create.createUser(current_user_data)
        promise.send(false, current_user)
      }
    })
  } else {
    //console.log("Has current user")
    promise.send(false, current_user)
  }

  return promise
}
