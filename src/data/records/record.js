
(function() {
  var adapter, record, utils;

  utils = require('../../utils');

  adapter = require('../../adapter');

  record = function(endpoint, data) {
    var f, file, i, index, key, keys;
    this.__is_blueprint_object = true;
    this.__no_content_root = false;
    this._endpoint = endpoint;
    this._object = data;
    this._files = {};
    if (typeof this._object.permissions === 'undefined') {
      this._object.permissions = {};
    }
    keys = ['read', 'write', 'destroy'];
    for (index in keys) {
      if (!isNaN(parseInt(index))) {
        key = keys[index] + '_group_ids';
        if (typeof this._object.permissions[key] === 'undefined') {
          this._object.permissions[key] = [];
        }
      }
    }
    if (typeof data['files'] !== 'undefined') {
      for (i in data['files']) {
        file = require('../files');
        f = data['files'][i];
        this._files[f['name']] = new file.createFile(f, this);
      }
    }
    return this;
  };

  record.prototype._addGroup = function(type, group) {
    var group_id, key;
    group_id = group.get('id');
    key = type + '_group_ids';
    return this._object.permissions[key].push(group_id);
  };

  record.prototype._removeGroup = function(type, group) {
    var group_id, index, key;
    group_id = group.get('id');
    key = type + '_group_ids';
    if (typeof this._object.permissions === 'object') {
      if (typeof this._object.permissions[key] === 'object') {
        index = this._object.permissions[key].indexOf(group_id);
        if (index !== -1) {
          return this._object.permissions[key].splice(index, 1);
        }
      }
    }
  };

  record.prototype.set = function(key, value) {
    return this._object.content[key] = value;
  };

  record.prototype.get = function(key) {
    if (key === 'id') {
      return this._object[key];
    } else if (this.__no_content_root) {
      return this._object[key];
    } else {
      return this._object.content[key];
    }
  };

  record.prototype.addReadGroup = function(group) {
    return this._addGroup('read', group);
  };

  record.prototype.addWriteGroup = function(group) {
    return this._addGroup('write', group);
  };

  record.prototype.addDestroyGroup = function(group) {
    return this._addGroup('destroy', group);
  };

  record.prototype.removeReadGroup = function(group) {
    return this._removeGroup('read', group);
  };

  record.prototype.removeWriteGroup = function(group) {
    return this._removeGroup('write', group);
  };

  record.prototype.removeDestroyGroup = function(group) {
    return this._removeGroup('destroy', group);
  };

  record.prototype.save = function() {
    var data, promise, that;
    promise = new utils.promise;
    that = this;
    data = {
      id: this._object['id'],
      content: this._object['content'],
      permissions: this._object['permissions']
    };
    if (this._object['user']) {
      data['user'] = this._object['user'];
    }
    adapter.Records.write(this._endpoint, data, function(data) {
      if (typeof data !== void 0) {
        that._object = data;
        return promise.send(false, that);
      }
    });
    return promise;
  };

  record.prototype["delete"] = function() {
    var promise, that;
    promise = new utils.promise;
    that = this;
    adapter.Records.destroy(this._endpoint, this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  record.prototype.trigger = function() {
    var promise, that;
    promise = new utils.promise;
    that = this;
    adapter.Records.trigger(this._endpoint, this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  record.prototype.createFile = function(properties, data) {
    var files;
    files = require('../files');
    return files.createFile(properties, this, data);
  };

  record.prototype.getFileWithName = function(file_name) {
    return this._files[file_name];
  };

  record.extend = function(object) {
    object.prototype = utils.extend(object.prototype, record.prototype);
    return object;
  };

  module.exports = record;

}).call(this);
