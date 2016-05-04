
(function() {
  var api;

  api = require('./api');

  module.exports = {
    write: function(model_name, data, callback) {
      return this.write_with_custom_path(model_name, model_name, data, callback);
    },
    trigger: function(model_name, id, callback) {
      var response_callback;
      response_callback = function(response) {
        return callback({});
      };
      return api.put(model_name + '/' + id + '/trigger', {}, response_callback);
    },
    write_with_custom_path: function(path, model_name, data, callback) {
      var request, response_callback;
      request = data;
      response_callback = function(response) {
        var data;
        data = {};
        if (response.error) {

        } else {
          data = response['response'][model_name][0];
        }
        return callback(data);
      };
      if (data.id) {
        return api.put(path + '/' + data.id, request, response_callback);
      } else {
        return api.post(path, request, response_callback);
      }
    },
    destroy: function(model_name, id, callback) {
      return this.destroy_with_custom_path(model_name, model_name, id, callback);
    },
    destroy_with_custom_path: function(path, model_name, id, callback) {
      var response_callback;
      response_callback = function(response) {
        var data;
        data = {};
        if (response.error) {

        } else {
          data = true;
        }
        return callback(data);
      };
      return api.post(path + '/' + id + '/destroy', {}, response_callback);
    },
    query: function(model_name, query, callback) {
      var request, response_callback;
      request = {
        'where': query
      };
      response_callback = function(response) {
        var data;
        data = [];
        if (response.error) {

        } else {
          data = response['response'][model_name];
        }
        return callback(data, response['meta']);
      };
      return api.post(model_name + '/query', request, response_callback);
    }
  };

}).call(this);
