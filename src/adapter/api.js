'use strict';

var Config = require('../config');
var Utils = require('../utils');
var Auth = require('./auth');
var Session = require('../session');

var bulkRequests = [];
var bulkRequestMasterTimer = void 0;
var bulkRequestIncrementalTimer = void 0;

module.exports = {
  post: function(path, data, callback) {
    var options = this.buildOptions('POST', path, data);
    return this.sendRequestAllowBulk(options, data, callback);
  },

  put: function(path, data, callback) {
    var options = this.buildOptions('PUT', path, data);
    return this.sendRequest(options, data, callback);
  },

  defaultOptions: function() {
    return {
      host: Config.get('host'),
      port: Config.get('port'),
      protocol: Config.get('protocol') + ':',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  },

  buildOptions: function(method, path) {
    return Utils.extend({}, this.defaultOptions(), {
      method: method,
      path: '/' + Config.get('applicationId') + '/' + path
    });
  },

  sendRequest: function(options, data, callback) {
    var postData = {
      request: data
    };

    if (Session.get('auth_token')) {
      postData = Auth.generateRequest(postData, options.path, options.method);
    }

    options.data = postData;

    return Utils.http.send(options, function(data) {
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

  sendRequestAllowBulk: function(options, data, callback) {
    var that = this;

    if (typeof bulkRequestMasterTimer === 'undefined')
      bulkRequestMasterTimer = setTimeout(function() {
        bulkRequestMasterTimer = undefined;
        that.sendBulkRequest();
      }, 250);

    if (bulkRequestIncrementalTimer) {
      clearTimeout(bulkRequestIncrementalTimer);
      bulkRequestIncrementalTimer = undefined;
    }

    bulkRequestIncrementalTimer = setTimeout(function() {
      bulkRequestIncrementalTimer = undefined;
      that.sendBulkRequest.call(that);
    }, 50);

    bulkRequests.push({
      options: options,
      data: data,
      callback: callback
    });
  },

  sendBulkRequest: function() {
    var handlingBulkRequests = [];
    var guids = [];

    for (var i in bulkRequests) {
      var guid = Auth.generateGuid();
      handlingBulkRequests[i] = bulkRequests[i];
      guids.push(guid);
    }

    bulkRequests = [];

    if (bulkRequestMasterTimer) {
      clearTimeout(bulkRequestMasterTimer);
      bulkRequestMasterTimer = undefined;
    }

    if (bulkRequestIncrementalTimer) {
      clearTimeout(bulkRequestIncrementalTimer);
      bulkRequestIncrementalTimer = undefined;
    }

    var callbacks = {};
    if (handlingBulkRequests.length > 1) {
      var formattedRequests = [];
      for (var guidIndex in guids) {
        var requestGuid = guids[guidIndex];
        var request = handlingBulkRequests[i];
        formattedRequests.push({
          endpoint: request.options.path.split('/')[2],
          request: request.data,
          guid: requestGuid
        });

        callbacks[requestGuid] = request.callback;
      }

      var data = {
        requests: formattedRequests
      };

      var options = this.buildOptions('POST', 'bulk_query', data);

      this.sendRequest(options, data, function(data) {
        if (data && !data.error) {
          for (var guid in data.response) {
            var response = data.response[guid];
            var callback = callbacks[guid];
            var meta = {};
            callback({
              'error': false,
              'meta': meta,
              'response': response
            });
          }
        } else {
          for (var requestIndex in handlingBulkRequests) {
            var request = handlingBulkRequests[requestIndex];
            request.callback({
              error: 1
            });
          }
        }
      });
    } else if (handlingBulkRequests[0]) {
      var handlingRequest = handlingBulkRequests[0];
      this.sendRequest(handlingRequest.options, handlingRequest.data, handlingRequest.callback);
    }
  }
};
