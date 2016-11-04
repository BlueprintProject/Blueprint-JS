'use strict';

var Utils = require('../../utils');
var Adapter = require('../../adapter');

/**
 * Creates a new record without a model
 * @name Blueprint.Data.Record
 * @class
 * @example
 * var dog = new Blueprint.Data.Record('pets', {
 *   species: 'dog',
 *   name: 'wiley'
 * });
 * @returns Blueprint.Model
 */

var Record = function(endpoint, object, preNested) {
  this.isBlueprintObject = true;
  this.noContentRoot = false;
  this.endpoint = endpoint;

  if (preNested) {
    if (object) {
      this.object = object;
    } else {
      this.object = {};
      this.object.content = {};
    }

    this._serverObjectContent = JSON.stringify(object.content);
  } else {
    this.object = {};
    this._serverObjectContent = JSON.stringify(object);
    this.object.content = object;
  }

  this.files = {};

  if (typeof this.object.permissions === 'undefined') {
    this.object.permissions = {};
  }

  var keys = [
    'read',
    'write',
    'destroy'
  ];

  for (var index in keys) {
    if (!isNaN(parseInt(index))) {
      var key = keys[index] + '_group_ids';
      if (typeof this.object.permissions[key] === 'undefined') {
        this.object.permissions[key] = [];
      }
    }
  }

  if (typeof this.object.files !== 'undefined') {
    for (var i in this.object.files) {
      var f = this.object.files[i];
      var File = require('../files/file');
      this.files[f.name] = new File(f, this);
    }
  }

  return this;
};


/**
 * Set a value in the object's content
 * @function Blueprint.Data.Record#set
 * @param key {string} - The key you would like to set
 * @param value {object} - The value you would like to set
 */
Record.prototype.set = function(key, value) {
  var keys = key.split(".")

  if(keys.length > 1) {
    var item = this.object.content;



    for(var i=0; i < keys.length; i++) {
      var key = keys[i];

      if(i == keys.length - 1) {
        item[key] = value;
      } if(typeof item[key] === 'undefined') {
        item = item[key] = {};
      } else {
        item = item[key];
      }
    }

    return value;
  } else {
    this.object.content[key] = value;
  }
};

/**
 * Get a value in the object's content
 * @function Blueprint.Data.Record#get
 * @param key {string} - The key you would like to get
 * @returns Object
 */
Record.prototype.get = function(key) {
  var keys = key.split(".")

  if(keys.length > 1) {
    var value = this.object.content;

    for(var i = 0; i < keys.length; i++) {
      var key = keys[i];
      value = value[key]
    }

    return value;
  } else if (key === 'id') {
    return this.object[key];
  } else {
    var value = this.object.content[key];
    if (!value) {
      value = this.object[key];
    }
    return value;
  }
};

/*
 * Permissions
 */

Record.prototype.addGroup = function(type, group) {
  var groupId = group.get('id');
  var key = type + '_group_ids';
  this.object.permissions[key].push(groupId);
};

Record.prototype.removeGroup = function(type, group) {
  var groupId = group.get('id');
  var key = type + '_group_ids';
  if (typeof this.object.permissions === 'object') {
    if (typeof this.object.permissions[key] === 'object') {
      var index = this.object.permissions[key].indexOf(groupId);
      if (index !== -1) {
        return this.object.permissions[key].splice(index, 1);
      }
    }
  }
};

/**
 * Authorize a group to read this record
 * @function Blueprint.Data.Record#addReadGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addReadGroup = function(group) {
  return this.addGroup('read', group);
};

/**
 * Authorize a group to write to this record
 * @function Blueprint.Data.Record#addWriteGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addWriteGroup = function(group) {
  return this.addGroup('write', group);
};

/**
 * Authorize a group to destroy this record
 * @function Blueprint.Data.Record#addDestroyGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addDestroyGroup = function(group) {
  return this.addGroup('destroy', group);
};

/**
 * Deauthorize a group from reading this record
 * @function Blueprint.Data.Record#removeReadGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeReadGroup = function(group) {
  return this.removeGroup('read', group);
};

/**
 * Deauthorize a group from writing to this record
 * @function Blueprint.Data.Record#removeWriteGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeWriteGroup = function(group) {
  return this.removeGroup('write', group);
};

/**
 * Deauthorize a group from destroying this record
 * @function Blueprint.Data.Record#removeDestroyGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeDestroyGroup = function(group) {
  return this.removeGroup('destroy', group);
};

/*
 * Files
 */

/**
  * Creates a file object to be uploaded to the server
  * @function Blueprint.Data.Record#createFile
  * @param name {string} - The name of the file to upload
  * @param data {blob} - The data you would like to upload
  */
Record.prototype.createFile = function(name, data) {
  var Files = require('../files');
  return new Files.File(name, this, data);
};

/**
  * Creates a file object to be uploaded to the server
  * @function Blueprint.Data.Record#getFileWithName
  * @param fileName {string} - The name of the file to get
  * @returns File
  */
Record.prototype.getFileWithName = function(fileName) {
  return this.files[fileName];
};

/**
  * Saves the record in the database
  * @function Blueprint.Data.Record#save
  * @returns Promise
  */
Record.prototype.save = function() {
  var promise = new Utils.promise();
  var that = this;
  var data = {
    id: this.object.id,
    content: this.object.content,
    permissions: this.object.permissions
  };

  if (this.object.user) {
    data.user = this.object.user;
  }

  Adapter.Records.write(this.endpoint, data, function(returnData) {
    if (typeof returnData === 'undefined') {
      promise.send(true, that.object);
    } else {
      that.object = returnData;
      that._serverObjectContent = JSON.stringify(returnData.content);
      promise.send(false, that);
    }
  });

  return promise;
};

/**
  * Removes the record in the database
  * @function Blueprint.Data.Record#destroy
  * @returns Promise
  */
Record.prototype.destroy = function() {
  var promise = new Utils.promise();

  Adapter.Records.destroy(this.endpoint, this.get('id'), function(data) {
    if (typeof data === 'undefined') {
      promise.send(true);
    } else {
      promise.send(false);
    }
  });

  return promise;
};

/**
  * Triggers an update notification for the record
  * @function Blueprint.Data.Record#trigger
  * @returns Promise
  */
Record.prototype.trigger = function() {
  var promise = new Utils.promise();

  Adapter.Records.trigger(this.endpoint, this.get('id'), function(data) {
    if (typeof data === 'undefined') {
      promise.send(true);
    } else {
      promise.send(false);
    }
  });
  return promise;
};

/**
  * Tests to see if the local object has been modified
  * @function Blueprint.Data.Record#didChange
  * @returns Boolean
  */
Record.prototype.didChange = function() {
  var localObjectContent = JSON.stringify(this.object.content);
  return localObjectContent !== this._serverObjectContent;
};

/**
  * Allows you to subclass this class
  * @function Blueprint.Data.Record.Extend
  * @returns Blueprint.Data.Record
  * @param object {object} - The object you would like to inject
  */
Record.extend = function(object) {
  object.prototype = Utils.extend(this.prototype, object.prototype);
  return object;
};

module.exports = Record;
