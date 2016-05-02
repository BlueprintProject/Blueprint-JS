var api = require("./api.js")

module.exports = {

  write: function(model_name, data, callback) {
    this.write_with_custom_path(model_name, model_name, data, callback)
  },

  trigger: function(model_name, id, callback) {
    var response_callback = function(response) {
      callback({});
    }

    api.put(model_name + "/" + id + "/trigger", {}, response_callback)
  },

  write_with_custom_path: function(path, model_name, data, callback) {
    var request = data

    var response_callback = function(response) {
      var data = {};
      if (response.error) {

      } else {
        data = response["response"][model_name][0]
      }

      callback(data);
    }

    if (data.id) {
      api.put(path + "/" + data.id, request, response_callback)
    } else {
      api.post(path, request, response_callback)
    }
  },

  destroy: function(model_name, id, callback) {
    this.destroy_with_custom_path(model_name, model_name, id, callback)
  },

  destroy_with_custom_path: function(path, model_name, id, callback) {
    var response_callback = function(response) {
      var data = {};
      if (response.error) {

      } else {
        data = true
      }

      callback(data);
    }

    api.post(path + "/" + id + "/destroy", {}, response_callback)
  },

  query: function(model_name, query, callback) {
    var request = {
      "where": query
    }

    var response_callback = function(response) {
      var data = [];
      if (response.error) {} else {
        data = response["response"][model_name]
      }
      callback(data, response["meta"]);
    }

    api.post(model_name + "/query", request, response_callback)
  }

}
