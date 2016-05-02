var Find = require("./find.js")
var Create = require("./create.js")

module.exports.createGroup = Create

module.exports.getPublicGroup  = Find.getPublicGroup
module.exports.getPrivateGroup = Find.getPrivateGroup
module.exports.groupWithId		= Find.groupWithId