'use strict';

var utils = require('../../utils');
var adapter = require('../../adapter');

/**
 * Creates a file object to be uploaded to the server. <br>
 * <b>Should not be called directly instead use, record.createFile</b>
 * @name File
 * @class
 * @see Blueprint.Data.Record#createFile
 * @example
 * var file = record.createFile('file_name.txt', data)
 * file.save().then(function(){
 *   // Upload Success!
 * })
 * @returns File
 */
var File = function(obj, record, data) {
  var properties;

  if (typeof obj === 'string') {
    properties = {
      name: obj
    };
  } else {
    properties = obj;
  }

  this.isBlueprintObject = true;
  this.endpoint = record.endpoint;
  properties.record_id = record.get('id'); // jshint ignore: line
  if (data && properties.size === void 0) {
    properties.size = data.size ? data.size : data.length;
  }
  this.data = data;
  this.object = properties;
  this.record = record;

  this._shouldSave = false;
  this._onSave = [];

  return this;
};

/**
 * Get a key from the file
 * @function File#get
 * @param key {string} - The key you would like to retrieve
 */
File.prototype.get = function(key) {
  return this.object[key];
};

/**
 * Save the file and upload it to the server
 * @function File#save
 * @returns Promise
 */
File.prototype.save = function() {
  this.object.record_id = this.record.get('id'); // jshint ignore: line
  this.record.files[this.get('name')] = this;


  console.log(this);

  if(typeof this.object.record_id === 'undefined') {
    this._shouldSave = true;

    var promise = new utils.promise();
    this._onSave.push(promise);

    return promise;
  } else {
    var promise = this._upload();

    this._shouldSave = false;

    var that = this;

    promise.then(function(result) {
      for(var i in that._onSave) {
        that._onSave[i].send(false, result);
      }

      that._onSave = [];
    }).fail(function(error) {
      for(var i in that._onSave) {
        that._onSave[i].send(error);
      }

      that._onSave = [];
    });

    return promise;
  }
}

File.prototype._upload = function() {
  var promise = new utils.promise();
  var that = this;
  var path = this.endpoint + '/' + this.getRecordId() + '/files';

  this.record.files[this.get('name')] = this;
  //console.log(this, this.record, this.record, this.get('name'));

  adapter.Records.writeWithCustomPath(path, 'files', {
    file: this.object
  }, function(response) {

    if (typeof response !== void 0 && response && response.upload_request) { // jshint ignore:line
      that.object = response;

      if (that.data) {

          var req = response.upload_request; // jshint ignore:line

          var params = req.params;
          params.file = that.data;

          var formData;

          if (FormData === undefined) {
            var FormData = require('form-data');
            formData = new FormData();
          } else {
            formData = new FormData();
          }

          for (var key in params) {
            var value = params[key];
            formData.append(key, value);
          }

          if (typeof global !== 'undefined' && global.navigator && global.navigator.product === 'ReactNative') {
              fetch(req.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
                body: formData
              }).then(function() {
                promise.send(false, that);
              }).catch(function(err) {
          		  promise.send(err);
              });
          } else {
            var xmlhttp;

            if (window.XMLHttpRequest) {
              xmlhttp = new XMLHttpRequest();
            } else {
              xmlhttp = new ActiveXObject('Microsoft.XMLHTTP'); // jshint ignore:line
            }

            xmlhttp.onreadystatechange = function() {
              if (xmlhttp.readyState === 4) {
                return promise.send(false, that);
              }
            };

            xmlhttp.open('post', req.url);
            xmlhttp.send(formData);
          }
      } else {
        return promise.send(false, that);
      }
    } else {
      return promise.send(true);
    }
  });
  return promise;
};

/**
 * Deletes a file
 * @function File#destroy
 */
File.prototype.destroy = function() {
  var promise = new utils.promise();
  var path = this.endpoint + '/' + this.get('record_id') + '/files';

  adapter.Records.destroyWithCustomPath(path, 'files', this.get('id'), function(data) {
    if (typeof data !== void 0) {
      return promise.send(false);
    }
  });

  return promise;
};

/**
 * Gets the signed URL for a file
 * @function File#getURL
 */
File.prototype.getURL = function() {
  var presignedURL = this.get('presigned_url');
  var valid = this.get('presigned_expiration') > ((new Date()) / 1000);

  if(typeof this.data === 'object' && typeof this.data.uri !== 'undefined') {
    return this.data.uri;
  } else if (presignedURL && valid) {
    return this.get('presigned_url');
  } else {
    var file = {
      'file_id': this.get('id'),
      'record_id': this.get('record_id'),
      'record_endpoint': this.endpoint
    };

    return adapter.Auth.generateSignedURLForFile(file);
  }
};

File.prototype.getRecordId = function() {
  if (this.record) {
    return this.record.get('id');
  } else {
    return this.get('record_id');
  }
};

module.exports = File;
