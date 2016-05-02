var Records = require('./records')
var Groups = require('./groups')
var Users = require("./users")
var Files = require("./files")
var CustomEndpoints = require("./custom_endpoints")
var Data = {}

Data.createRecord = Records.create
Data.findRecords = Records.find.findRecords
Data.findRecord = Records.find.findRecord
Data.record = Records.record

Data.createGroup = Groups.createGroup
Data.getPublicGroup = Groups.getPublicGroup
Data.getPrivateGroup = Groups.getPrivateGroup
Data.groupWithId = Groups.groupWithId

Data.getCurrentUser = Users.getCurrentUser
Data.registerUser = Users.registerUser

Data.performEndpoint = CustomEndpoints.perform

Data.model = require("./models")

module.exports = Data
