
(function() {
  var auth, bulk_request_incremental_timer, bulk_request_master_timer, bulk_requests, config, session, utils;

  config = require('../config');

  utils = require('../utils');

  auth = require('./auth');

  session = require('../session');

  bulk_requests = [];

  bulk_request_master_timer = void 0;

  bulk_request_incremental_timer = void 0;

  module.exports = {
    post: function(path, data, callback) {
      var options;
      options = this._build_options('POST', path, data);
      return this._send_request_allow_bulk(options, data, callback);
    },
    put: function(path, data, callback) {
      var options;
      options = this._build_options('PUT', path, data);
      return this._send_request(options, data, callback);
    },
    _default_options: function() {
      return {
        host: config.get('host'),
        port: config.get('port'),
        protocol: config.get('protocol') + ':',
        headers: {
          'Content-Type': 'application/json'
        }
      };
    },
    _build_options: function(method, path, data) {
      return utils.extend({}, this._default_options(), {
        method: method,
        path: '/' + config.get('application_id') + '/' + path
      });
    },

    _send_request: function(options, data, callback) {
      var post_data;
      post_data = {
        request: data
      };
      if (session.get('auth_token')) {
        post_data = Auth._generate_request(post_data, options.path, options.method);
      }
      options['data'] = post_data;
      return utils.http.send(options, function(data) {
        if (callback) {
          if (typeof data === 'undefined') {
            return callback({
              error: 1
            });
          } else {
            return callback(data);
          }
        }
      });
    },

    _send_request_allow_bulk: function(options, data, callback) {

      var that

      that = this;

      if(typeof bulk_request_master_timer === "undefined")
        bulk_request_master_timer = setTimeout(function() {
          bulk_request_master_timer = undefined;
          that._send_bulk_request()
        }, 250)

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer);
        bulk_request_incremental_timer = undefined;
      }

      bulk_request_incremental_timer = setTimeout(function() {
        bulk_request_incremental_timer = undefined;
        that._send_bulk_request.call(that)
      }, 50)

      bulk_requests.push({
        options: options,
        data: data,
        callback: callback
      })

    },

    _send_bulk_request: function() {

      var handling_bulk_requests = []
      var guids = []

      for(var i in bulk_requests) {
        var guid = require("./auth.js")._generate_guid()

        handling_bulk_requests[i] = bulk_requests[i];
        guids.push(guid)
      }

      bulk_requests = [];

      if(bulk_request_master_timer) {
        clearTimeout(bulk_request_master_timer);
        bulk_request_master_timer = undefined;
      }

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer);
        bulk_request_incremental_timer = undefined;
      }

      var callbacks = {};

      if(handling_bulk_requests.length > 1) {

        var formatted_requests = []

        for(var i in guids) {
          var guid = guids[i]

          var request = handling_bulk_requests[i];

          formatted_requests.push({
            endpoint: request["options"]["path"].split("/")[2],
            request: request["data"],
            guid: guid
          })

          callbacks[guid] = request.callback
        }


        var data = {requests: formatted_requests};
        var options = this._build_options("POST", "bulk_query", data)
        this._send_request(options, data, function(data) {
          if(data && !data["error"]) {
            for(var guid in data["response"]) {
              var response = data["response"][guid];

              var callback = callbacks[guid]
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

      } else if(handling_bulk_requests[0]) {
        var request = handling_bulk_requests[0];
        this._send_request(request.options, request.data, request.callback)
      }

    }


  };

}).call(this);
