if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}

describe("Records", function() {

  var prefix = Date.now().toString()
  var user_b
  var record

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
        done()
      });
    });
  })


  // Create

  it("Can Create Record", function(done){
    var record = Blueprint.createRecord("post", {
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

    record.save().then(function(error, record){
      if(error) {
        throw new Error("Server returned error")
      }

      if(!record.get("id")) {
        throw new Error("Record does not have an id")
      }

      if(record.get("nested_content")["boolean"] != true) {
        throw new Error("Nested object is not properly formatted")
      }

      done()
    })
  })

  // Query
  it("Can Query Records", function(done){
    Blueprint.findRecords("post", {
      category_id: 1
    }).then(function(error, records){

      if(error) {
        throw new Error("Server returned error")
      }

      if(records.length == 0) {
        throw new Error("Query returned empty array")
      }

      for(var index in records) {
        var record = records[index]
        if(!record.get("id")) {
          throw new Error("Returned object do not have an id")
        }
      }

      done()
    })
  })

  // Query & Update
  it("Can Query Record and Update it", function(done) {
    Blueprint.findRecord("post", {timestamp: prefix}).then(function(error, r) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      record = r

      record.set("title", "This is a test " + prefix)

      record.save().then(function(error, record){
        if(error) {
          throw new Error("Server Returned Error [1]")
        }

        if(record.get("title") != "This is a test " + prefix) {
          throw new Error("Returned object did not have the correct title")
        }

        done()
      })
    })
  })


  it("Can add user to record permissions", function(done) {
    record.addReadGroup(user_b)
    record.addWriteGroup(user_b)
    record.addDestroyGroup(user_b)
    record.save().then(function(error, record) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }
      done()
    })
  });

  it("Can remove user from record permissions", function(done) {
    record.removeReadGroup(user_b)
    record.removeWriteGroup(user_b)
    record.removeDestroyGroup(user_b)
    record.save().then(function(error, record) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }
      done()
    })
  });

  it("Can toggle user permissions without saving", function(done) {
    record.addReadGroup(user_b)
    record.addWriteGroup(user_b)
    record.addDestroyGroup(user_b)

    record.removeReadGroup(user_b)
    record.removeWriteGroup(user_b)
    record.removeDestroyGroup(user_b)

    done()
  });


  // Query & Delete
  it("Can Query Record and Delete it", function(done) {
    Blueprint.findRecord("post", {timestamp: prefix}).then(function(error, record) {
      if(error) {
        throw new Error("Server Returned Error [0]")
      }

      record.set("title", "This is a test " + prefix)

      record.delete().then(function(error, record){
        if(error) {
          throw new Error("Server Returned Error [1]")
        }

        done()
      })
    })
  })

})
