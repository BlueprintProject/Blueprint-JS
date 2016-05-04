
(function() {
  var adapter, utils;

  adapter = require('../../adapter');

  utils = require('../../utils');

  module.exports = function(properties) {
    this.__is_blueprint_object = true;
    this._object = properties;
    this._modifyUserMembership = function(user_id, type, adding) {
      var action, index, inverse_action, inverse_key, key;
      action = void 0;
      inverse_action = void 0;
      key = void 0;
      inverse_key = void 0;
      if (adding) {
        action = 'add';
        inverse_action = 'remove';
      } else {
        action = 'remove';
        inverse_action = 'add';
      }
      key = action + '_' + type + '_ids';
      inverse_key = inverse_action + '_' + type + '_ids';
      if (typeof this._object[key] === 'undefined') {
        this._object[key] = [];
      }
      if (this._object[key].indexOf(user_id) === -1) {
        this._object[key].push(user_id);
      }
      if (typeof this._object[inverse_key] === 'object') {
        index = this._object[inverse_key].indexOf(user_id);
        if (index !== -1) {
          return this._object[inverse_key].splice(index, 1);
        }
      }
    };
    this.get = function(key) {
      return this._object[key];
    };
    this.set = function(key, value) {
      return this._object[key] = value;
    };
    this.addUser = function(user) {
      return this._modifyUserMembership(user.get('id'), 'user', true);
    };
    this.removeUser = function(user) {
      return this._modifyUserMembership(user.get('id'), 'user', false);
    };
    this.addSuperUser = function(user) {
      return this._modifyUserMembership(user.get('id'), 'super_user', true);
    };
    this.removeSuperUser = function(user) {
      return this._modifyUserMembership(user.get('id'), 'super_user', false);
    };
    this.addUserWithId = function(user) {
      return this._modifyUserMembership(user, 'user', true);
    };
    this.removeUserWithId = function(user) {
      return this._modifyUserMembership(user, 'user', false);
    };
    this.addSuperUserWithId = function(user) {
      return this._modifyUserMembership(user, 'super_user', true);
    };
    this.removeSuperUserWithId = function(user) {
      return this._modifyUserMembership(user, 'super_user', false);
    };
    this.join = function(request) {
      var callback, promise, that;
      promise = new utils.promise;
      that = this;
      callback = function(data) {
        that._object = data;
        return promise.send(false, that);
      };
      adapter.Api.post('groups/' + this.get('id') + '/join', {
        group: request
      }, function(response) {
        var data;
        data = [];
        if (response.error) {

        } else {
          data = response['response']['groups'][0];
        }
        return callback(data);
      });
      return promise;
    };
    this.leave = function() {
      var callback, promise, that;
      promise = new utils.promise;
      that = this;
      callback = function(data) {
        that._object = data;
        return promise.send(false, that);
      };
      adapter.Api.post('groups/' + this.get('id') + '/leave', {}, function(response) {
        var data;
        data = [];
        if (response.error) {

        } else {
          data = response['response']['groups'][0];
        }
        return callback(data);
      });
      return promise;
    };
    this.save = function() {
      var promise, that;
      promise = new utils.promise;
      that = this;
      adapter.Records.write('groups', this._object, function(data) {
        if (typeof data !== void 0) {
          that._object = data;
          return promise.send(false, that);
        }
      });
      return promise;
    };
    this["delete"] = function() {
      var promise, that;
      promise = new utils.promise;
      that = this;
      adapter.Api.post('groups/' + this.get('id') + '/destroy', {}, function(data) {
        if (typeof data !== void 0) {
          return promise.send(false);
        }
      });
      return promise;
    };
    return this;
  };

}).call(this);
