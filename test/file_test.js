if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}

describe("Files", function() {

  var prefix = Date.now().toString()
  var user_b
  var record
  var file

  before(function(done) {
    // Setup
    Blueprint.Init({
    	application_id: "5543850719b6366c23000001",
      port: 8080
    })

    // Create a user
    Blueprint.Register({
      email: prefix + "_b@test.goblueprint.co",
      password: "1234567890a",
      name: prefix + " Test User B"
    }).then(function(error, user){
      user_b = user

      Blueprint.Register({
        email: prefix + "@test.goblueprint.co",
        password: "1234567890a",
        name: prefix + " Test User"
      }).then(function(error, user){
        record = Blueprint.createRecord("post", {
          category_id: 1,
          timestamp: prefix,
          nested_content: {
            boolean: true
          },
          title: "Hello there!",
          content: "This is a sample record."
        })

        record.addReadGroup(Blueprint.getPublicGroup())
        record.addWriteGroup(Blueprint.getPrivateGroup())
        record.addDestroyGroup(Blueprint.getPrivateGroup())

        record.save().then(function() {
          done()
        })
      });
    });
  })


  // Create

  it("Can Create File", function(done){
    file = record.createFile({
			size: 2352,
			name: "testing.txt"
		})

    file.save().then(function(error, file) {
      if(error) {
        throw new Error("Server returned error")
      }

      done()
		})
  })

  // Query
  it("Can Get File URL", function(done){
    var url = file.getURL()
    if(url) {

      done()
    }

  })

  // Query & Delete
  it("Can Delete File", function(done) {
    file.delete().then(function(error, file) {
      if(error) {
        throw new Error("Server returned error")
      }

      done()
    })
  })

})
