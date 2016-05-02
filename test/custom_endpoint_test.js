if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}

describe("Custom Endpoint", function() {

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
      email: prefix + "_c@test.goblueprint.co",
      password: "1234567890a",
      name: prefix + " Test User C"
    }).then(function(error, user){
      done()
    });
  })


  // Create

  it("Can Run Custom Endpoint", function(done){
    Blueprint.performEndpoint("example", {testing: true}).then(function(error, response) {
      if(!error) {
        done()
      }
  	});
  })

})
