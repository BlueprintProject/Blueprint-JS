var session = require("../../session.js")
var config = require("../../config.js")
var group = require("./group.js")

module.exports.getPrivateGroup = function() {
  return new group({
    id:session.get("user_id")
  })
}

module.exports.getPublicGroup = function() {
  return new group({
    id:config.get("application_id")
  })
}

module.exports.groupWithId = function(id) {
	return new group({
		id: id
	})
}