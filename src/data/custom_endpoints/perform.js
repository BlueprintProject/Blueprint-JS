var adapter = require('../../adapter')
var utils = require('../../utils')

module.exports = function(name, parameters) {
  var path = "custom_endpoints/" + name
  var promise = new utils.promise
  adapter.api.post(path, parameters, function(response){
    data = response["response"][name]

    promise.send(false, data)
  })

  return promise
}
