
(function() {
  var adapter, file, record, utils;

  record = require('../records/record');

  utils = require('../../utils');

  adapter = require('../../adapter');

  file = record.extend(function(properties, record, data) {
    this.__is_blueprint_object = true;
    this._endpoint = record._endpoint;
    properties['record_id'] = record.get('id');
    if (data && properties['size'] === void 0) {
      properties['size'] = data.length;
    }
    this._data = data;
    this._object = properties;
    return this;
  });

  file.prototype.get = function(key) {
    return this._object[key];
  };

  file.prototype.save = function() {
    var path, promise, that;
    promise = new utils.promise;
    that = this;
    path = this._endpoint + '/' + this.get('record_id') + '/files';
    adapter.Records.write_with_custom_path(path, 'files', {
      file: this._object
    }, function(data) {
      var form_data, key, params, req, value, xmlhttp;
      if (typeof data !== void 0) {
        that._object = data;
        req = data['upload_request'];
        params = req['params'];
        params['file'] = that._data;
        form_data = new FormData;
        for (key in params) {
          value = params[key];
          form_data.append(key, value);
        }
        if (window.XMLHttpRequest) {
          xmlhttp = new XMLHttpRequest;
        } else {
          xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState === 4) {
            return promise.send(false, that);
          }
        };
        xmlhttp.open('post', req['url']);
        return xmlhttp.send(form_data);
      }
    });
    return promise;
  };

  file.prototype["delete"] = function() {
    var path, promise, that;
    promise = new utils.promise;
    that = this;
    path = this._endpoint + '/' + this.get('record_id') + '/files';
    adapter.Records.destroy_with_custom_path(path, 'files', this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  file.prototype.getURL = function() {
    var file;
    file = {
      file_id: this.get('id'),
      record_id: this.get('record_id'),
      record_endpoint: this._endpoint
    };
    return adapter.Auth.generateSignedURLForFile(file);
  };

  module.exports = file;

}).call(this);
