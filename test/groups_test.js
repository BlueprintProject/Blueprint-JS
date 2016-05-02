if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}
var current_user

describe("Groups", function() {

  var prefix = Date.now().toString()

  before(function(done) {
    // Setup
    Blueprint.Init({
    	application_id: "5543850719b6366c23000001",
      port: 8080
    })

    // Create a user
    Blueprint.Register({
      email: prefix + "@test.goblueprint.co",
      password: "1234567890a",
      name: prefix + " Test User"
    }).then(function(error, user){
      Blueprint.getCurrentUser().then(function(error, user) {
        current_user = user
        done()
      });
    });
  })

  var private_group, open_group;

  it("Can Create a group and join it", function(done) {
    private_group = Blueprint.createGroup({
      name: "Test Group " + prefix
    })

    private_group.addSuperUser(current_user)
    private_group.save().then(function(error, group){
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      group.addUser(current_user)
      group.save().then(function(error, group) {
        if(error) {
          throw new Error("Server Returned Error [0]")
        }

        done()
      })
    })

  })

  it("Can Leave a group", function(done) {
    private_group.leave().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })

  it("Can add user to group", function(done){
    private_group.addUser(current_user)
    private_group.save().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })

  it("Can remove user from group", function(done){
    private_group.removeUser(current_user)
    private_group.save().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })

  it("Can Delete a group", function(done) {
    private_group.delete().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })


  it("Can Create a group with password and join it", function(done) {
    private_group = Blueprint.createGroup({
      name: "Test Group " + prefix,
      password: "abcdefg"
    })

    private_group.addSuperUser(current_user)

    private_group.save().then(function(error, group){
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      group.join({password: "abcdefg"}).then(function(error, group) {
        if(error) {
          throw new Error("Server Returned Error [1]")
        }

        done()
      })
    })

  })

  it("Can update the name of a group", function(done) {
    private_group.set("name", "Test Group")
    private_group.save().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      if(group.get("name") != "Test Group") {
        throw new Error("Group name could not be changed")
      }

      done()
    })
  })

  it("Can toggle super user membership without saving", function(done) {
    private_group.removeSuperUser(current_user)
    private_group.addSuperUser(current_user)
    done()
  })

  it("Can remove self as super user from group", function(done) {
    private_group.removeSuperUser(current_user)
    private_group.save().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })


  it("Can create an open group", function(done) {
    open_group = Blueprint.createGroup({
      name: "Public Group " + prefix,
      open: true
    })

    open_group.save().then(function(error, group){
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })

  it("Can join an open group", function(done) {
    open_group.join().then(function(error, group) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      done()
    })
  })
})
