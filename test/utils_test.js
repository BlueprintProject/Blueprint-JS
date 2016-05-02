if(typeof Blueprint === "undefined") {
  var Blueprint = require("../src")
}

describe("Utilities", function() {
  it("Can Run Empty Promise", function(done){
    var promise = new Blueprint.__utilities.promise
    promise.send()

    done()
  });

})
