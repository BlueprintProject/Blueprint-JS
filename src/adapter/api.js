var config = require("../config.js")
var utils = require("../utils")
var auth = require("./auth.js")
var session = require("../session.js")


var bulk_requests = [];
var bulk_request_master_timer;
var bulk_request_incremental_timer;


module.exports = {

  //
  // Basic Public HTTP Functions
  //

  post: function(path, data, callback) {
    var options = this._build_options("POST", path, data)
    this._send_request_allow_bulk(options, data, callback)
  },

  put: function(path, data, callback) {
    var options = this._build_options("PUT", path, data)
    this._send_request(options, data, callback)
  },

  //
  // Low Level Methods
  //

  _default_options: function(){
    return {
      host: config.get("host"),
      port: config.get("port"),
      protocol: config.get("protocol") + ":",
      headers: {
          'Content-Type': 'application/json'
      }
    }
  },

  _build_options: function(method, path, data) {
    return utils.extend({}, this._default_options(), {
      method: method,
      path: "/" + config.get("application_id") + "/" + path
    })
  },

  //

  //
  // Low Level HTTP Request
  //

  _send_request: function(options, data, callback) {
    var post_data = {
      request: data
    }

    if(session.get("auth_token")) {
      post_data = auth._generate_request(post_data, options.path, options.method)
    }

    options["data"] = post_data
    utils.http.send(options, function(data) {
      if(callback) {
        if(typeof data === "undefined") {
          callback({error: 1})
        } else {
          callback(data)
        }
      }
    });
  },

  _send_request_allow_bulk: function(options, data, callback) {
    var path_components = options["path"].split("/")
    var last_component = path_components[path_components.length - 1]

    if(last_component == "query") {
      bulk_requests.push({
        options: options,
        data: data,
        callback: callback})
      var that = this;

      if(!bulk_request_master_timer) {
        bulk_request_master_timer = setTimeout(function() {
          bulk_request_master_timer = undefined;
          that._send_bulk_request()
        }, 250)
      }

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer)
      }

      bulk_request_incremental_timer = setTimeout(function() {
        bulk_request_incremental_timer = undefined;
        that._send_bulk_request()
      }, 50)

    } else {
      this._send_request(options, data, callback)
    }
  },

  _send_bulk_request: function() {
    if(bulk_request_master_timer) {
      clearTimeout(bulk_request_master_timer);
      bulk_request_master_timer = undefined;
    }

    if(bulk_request_incremental_timer) {
      clearTimeout(bulk_request_incremental_timer);
      bulk_request_incremental_timer = undefined;
    }

    var copied_bulk_requests = {};

    for(var i in bulk_requests) {
      var guid = require("./auth.js")._generate_guid()
      copied_bulk_requests[guid] = bulk_requests[i];
    }

    bulk_requests = [];

    var formatted_requests = [];
    for(var i in copied_bulk_requests) {
      var request = copied_bulk_requests[i];

      formatted_requests.push({
        endpoint: request["options"]["path"].split("/")[1],
        request: request["data"],
        guid: i
      })

      var data = {requests: formatted_requests};
      var options = this._build_options("POST", "bulk_query", data)
      this._send_request(options, data, function(data) {
        if(data && !data["error"]) {
          for(var i in data["response"]) {
            var response = data["reponse"][i];
            var callback = formatted_requests[i]["callback"]
            var meta = {};

            callback({"error":false,"meta":meta,"response": response})
          }
        } else {
          for(var i in copied_bulk_requests) {
            var request = copied_bulk_requests[i]
            request["callback"]({error: 1})
          }
        }

      })
    }

  }

}
