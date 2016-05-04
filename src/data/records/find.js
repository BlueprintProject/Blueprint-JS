
(function() {
  var adapter, FindOne, Find, record, utils;

  record = require('./record');

  utils = require('../../utils');

  adapter = require('../../adapter');

  Find = function(model, query) {
    var promise;
    promise = new utils.promise;
    adapter.Records.query(model, query, function(data, meta) {
      var i, object, objects;
      objects = [];
      if (data) {
        i = 0;
        while (i < data.length) {
          object = data[i];
          object = new record(model, object);
          objects.push(object);
          i++;
        }
      }
      return promise.send(false, objects, meta);
    });
    return promise;
  };

  FindOne = function(model, query) {
    var promise;
    promise = new utils.promise;
    adapter.Records.query(model, query, function(data, meta) {
      var object;
      object = null;
      if (data) {
        object = new record(model, data[0]);
      }
      return promise.send(false, object, meta);
    });
    return promise;
  };

  module.exports.Find = Find;

  module.exports.FindOne = FindOne;

}).call(this);
