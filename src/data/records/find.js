var record = require('./record.js')
var utils = require('../../utils')
var adapter = require('../../adapter')


var findRecords = function(model, query) {
  var promise = new utils.promise

  adapter.records.query(model, query, function(data, meta) {

    var objects = []
    if (data) {
      for (var i = 0; i < data.length; i++) {
        var object = data[i];
        object = new record(model, object)
        objects.push(object)
      }
    }

    promise.send(false, objects, meta)
  })

  return promise
}

var findRecord = function(model, query) {
  var promise = new utils.promise

  adapter.records.query(model, query, function(data, meta) {
    var object = null;
    if (data) {
      object = new record(model, data[0])
    }
    promise.send(false, object, meta)
  })

  return promise
}

module.exports.findRecords = findRecords;
module.exports.findRecord = findRecord;
