'use strict';

var api = require('./api');
module.exports = {
  write: function(modelName, data, callback) {
    return this.writeWithCustomPath(modelName, modelName, data, callback);
  },

  trigger: function(modelName, id, callback) {
    var responseCallback = function() {
      return callback({});
    };

    return api.put(modelName + '/' + id + '/trigger', {}, responseCallback);
  },

  writeWithCustomPath: function(path, modelName, data, callback) {
    var request = data;

    var responseCallback = function(response) {
      var data;

      if (response.error) {
        data = undefined;
      } else {
        data = response.response[modelName][0];
      }
      return callback(data);
    };

    if (data.id) {
      return api.put(path + '/' + data.id, request, responseCallback);
    } else {
      return api.post(path, request, responseCallback);
    }
  },

  destroy: function(modelName, id, callback) {
    return this.destroyWithCustomPath(modelName, modelName, id, callback);
  },

  destroyWithCustomPath: function(path, modelName, id, callback) {

    var responseCallback = function(response) {
      var data = {};

      if (!response.error) {
        data = true;
      }

      return callback(data);
    };

    return api.post(path + '/' + id + '/destroy', {}, responseCallback);
  },

  query: function(modelName, query, callback) {
    var request = {
      'where': query
    };

    var responseCallback = function(response) {
      var data;
      data = [];
      if (response.error) {
      } else {
        data = response.response[modelName];
      }
      return callback(data, response.meta);
    };

    return api.post(modelName + '/query', request, responseCallback);
  }
};
