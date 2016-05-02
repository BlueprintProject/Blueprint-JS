var modelify = function(records, inject) {
  if(records.__is_blueprint_object) {
    inject(records);
    return records;
  } else {
    var modeled_records = [];

    records.forEach(function(v, i) {
      inject(v);
      modeled_records.push(v);
    })

    return modeled_records;
  }
}

module.exports = function(name, instance_code) {
  var utils = require("../../utils");

  this.instance_code = instance_code

  var inject = function(obj) {
    obj.update = function(data) {
      for(var key in data) {
        var value = data[key];
        obj.set(key, value);
      }
    }

    instance_code.call(obj);
  };

  this.create = function(base_data) {
    var object = modelify(require("../records").create(name, {}), inject);

    if(base_data) {
      object.update(base_data);
    }

    return object;
  };

  this.findRecords = function(where) {
    var promise = new utils.promise

    require('../records/find.js').findRecords(name, where).then(function(error, results) {
      if(results) {
        results = modelify(results, inject)
      }

      promise.send(error, results);
    });

    return promise;
  };

  this.findRecord = function(where) {
    var promise = new utils.promise

    require('../records/find.js').findRecords(name, where).then(function(error, result) {
      if(result) {
        result = modelify(result, inject)
      }

      promise.send(error, result);
    });

    return promise;
  };

  return this;
}
