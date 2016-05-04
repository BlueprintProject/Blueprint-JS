
(function() {
  var modelify;

  modelify = function(records, inject) {
    var modeled_records;
    if (records.__is_blueprint_object) {
      inject(records);
      return records;
    } else {
      modeled_records = [];
      records.forEach(function(v, i) {
        inject(v);
        return modeled_records.push(v);
      });
      return modeled_records;
    }
  };

  module.exports = function(name, instance_code) {
    var constructor, inject, utils;
    utils = require('../../utils');
    inject = function(obj) {
      obj.update = function(data) {
        var key, results1, value;
        results1 = [];
        for (key in data) {
          value = data[key];
          results1.push(obj.set(key, value));
        }
        return results1;
      };
      return instance_code.call(obj);
    };
    constructor = function(base_data) {
      var object;
      object = modelify(require('../records').create(name, {}), inject);
      if (base_data) {
        object.update(base_data);
      }
      return object;
    };
    constructor.find = function(where) {
      var promise;
      promise = new utils.promise;
      require('../records/find').Find(name, where).then(function(results) {
        results = modelify(results, inject);
        return promise.send(void 0, results);
      }).fail(function(error) {
        return promise.send(error);
      });
      return promise;
    };
    constructor.findOne = function(where) {
      var promise;
      promise = new utils.promise;
      require('../records/find').FindOne(name, where).then(function(result) {
        result = modelify(result, inject);
        return promise.send(void 0, result);
      }).fail(function(error) {
        return promise.send(error);
      });
      return promise;
    };
    return constructor;
  };

}).call(this);
