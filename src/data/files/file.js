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
var File = function(name, record, data) {
  var properties = {
    name: name
  };

  this.isBlueprintObject = true;
  this.endpoint = record.endpoint;
  properties.recordId = record.get('id');
  if (data && properties.size === void 0) {
    properties.size = data.length;
  }
  this.data = data;
  this.object = properties;
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
  var promise = new utils.promise();
  var that = this;
  var path = this.endpoint + '/' + this.get('record_id') + '/files';

  adapter.Records.writeWithCustomPath(path, 'files', {
    file: this.object
  }, function(data) {

    if (typeof data !== void 0) {

      that.object = data;

      var req = data.upload_request; // jshint ignore:line

      var params = req.params;
      params.file = that.data;

      var formData = new FormData();

      for (var key in params) {
        var value = params[key];
        formData.append(key, value);
      }

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
      return xmlhttp.send(formData);
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
  var file = {
    'file_id': this.get('id'),
    'record_id': this.get('record_id'),
    'record_endpoint': this.endpoint
  };

  return adapter.Auth.generateSignedURLForFile(file);
};

module.exports = File;
