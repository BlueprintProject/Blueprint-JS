'use strict';

var modelify = function(records, inject) {
  if (records.isBlueprintObject) {
    inject(records);
    return records;
  } else {
    var modeledRecords = [];
    records.forEach(function(v) {
      inject(v);
      return modeledRecords.push(v);
    });
    return modeledRecords;
  }
};

/**
 * Creates a new record without a model
 * @name Blueprint.Model
 * @class
 * @example
 * var dog = new Blueprint.Model('pets', function(){
 *   // Custom Model Methods
 * });
 * @returns Blueprint.Model
 */

var Model = function(name, instanceCode) {
  var utils = require('../../utils');

  var inject = function(obj) {
    obj.update = function(data) {
      var results1 = [];
      for (var key in data) {
        var value = data[key];
        results1.push(obj.set(key, value));
      }
      return results1;
    };

    return instanceCode.call(obj);
  };

  var constructor = function(baseData) {
    var object = modelify(require('../records').create(name, {}), inject);
    if (baseData) {
      object.update(baseData);
    }
    return object;
  };

  /**
   * Query the database for records without a model
   * @param {string} model - The name of the endpoint the record belongs to
   * @param {object} query - The query
   * @function Blueprint.Model.Find
   * @returns Promise
   */

  constructor.Find = function(where) {
    var promise = new utils.promise();
    require('../records/find').Find(name, where).then(function(results) {
      results = modelify(results, inject);
      return promise.send(void 0, results);
    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  /**
   * Query the database for a single record without a model
   * @param {string} model - The name of the endpoint the record belongs to
   * @param {object} query - The query
   * @function Blueprint.Model.FindOne
   * @returns Promise
   */

  constructor.FindOne = function(where) {
    var promise = new utils.promise();
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

module.exports = Model;
