var adapter = require('../../adapter')
var utils = require('../../utils')
var create = require("./create.js")

module.exports = function(id) {
  var promise = new utils.promise

  var path = "users/" + id
  adapter.api.post(path, parameters, function(response){
    data = response["response"]["users"][0]
    user = create.createUser(data)
    promise.send(false, user)
  })

  return promise
}
