if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}

var current_user

describe("Users", function() {

  var prefix = Date.now().toString()

  before(function() {
    Blueprint.Init({
    	application_id: "5543850719b6366c23000001",
      port: 8080
    })
  })

  it("Can Create User", function(done){

    Blueprint.Register({
      email: prefix + "@test.goblueprint.co",
      password: "1234567890a",
      name: prefix + " Test User"
    }).then(function(error, user){
      if(error) {
        throw new Error("Server Returned Error")
      } else {
        if(typeof user.get("id") == "undefined") {
          throw new Error("User does not have an ID")
        }
      }

      Blueprint.getCurrentUser().then(function(error, user) {
        current_user = user
        done()
      });
    });
  })

  it("Can Authenticate as User", function(done){

    Blueprint.Authenticate({
      email: prefix + "@test.goblueprint.co",
      password: "1234567890a",
    }).then(function(error){
      if(error) {
        throw new Error("Server Returned Error")
      } else {
        if(typeof current_user.get("id") == "undefined") {
          throw new Error("User does not have an ID")
        }
      }
      done()
    });

  })

  it("Can Delete User", function(done){

    current_user.delete().then(function(error){
      if(error) {
        throw new Error("Server Returned Error")
      }

      done()
    });

  })

  it("Can Restore User Session", function(done){
    if(!Blueprint.RestoreSession()) {
      throw new Error("Could not restore session")
    }
    done()
  })

  it("Can Logout User", function(done){
    Blueprint.Logout()
    done()
  })
})
