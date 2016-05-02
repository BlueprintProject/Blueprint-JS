var Create = require("./create.js")
var CurrentUser = require("./current_user.js")
var Find = require("./find.js")

module.exports = {
  createUser: Create.createUser,
  registerUser: Create.registerUser,
  getCurrentUser: CurrentUser,
  findUserById: Find
}
