'use strict';

var adapter = require('../../adapter');
var utils = require('../../utils');

/**
 * Creates a file object to be uploaded to the server. <br>
 * @class Group
 * @param properties {object} - The content of the group object
 * @returns Group
 */
var Group = function(properties) {
  this.isBlueprintObject = true;
  this.object = properties;
  this.modifyUserMembership = function(userId, type, adding) {
    var action = void 0;
    var inverseAction = void 0;
    var key = void 0;
    var inverseKey = void 0;

    if (adding) {
      action = 'add';
      inverseAction = 'remove';
    } else {
      action = 'remove';
      inverseAction = 'add';
    }

    key = action + '_' + type + '_ids';
    inverseKey = inverseAction + '_' + type + '_ids';

    if (typeof this.object[key] === 'undefined') {
      this.object[key] = [];
    }

    if (this.object[key].indexOf(userId) === -1) {
      this.object[key].push(userId);
    }

    if (typeof this.object[inverseKey] === 'object') {
      var index = this.object[inverseKey].indexOf(userId);
      if (index !== -1) {
        return this.object[inverseKey].splice(index, 1);
      }
    }
  };

  return this;
};

/**
 * Get a value in the object's content
 * @function Group#get
 * @param key {string} - The key you would like to get
 * @returns Object
 */

Group.prototype.get = function(key) {
  return this.object[key];
};

/**
 * Set a value in the object's content
 * @function Group#set
 * @param key {string} - The key you would like to get
 * @param value {object} - The value you would like to set
 */
Group.prototype.set = function(key, value) {
  this.object[key] = value;
};


/**
 * Add a user to a group
 * @function Group#addUser
 * @param user {Blueprint.User} - The user you would like to add
 */
Group.prototype.addUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'user', true);
};

/**
 * Remove a user to a group
 * @function Group#removeUser
 * @param user {Blueprint.User} - The user you would like to remove
 */
Group.prototype.removeUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'user', false);
};

/**
 * Add user to a group as super user
 * @function Group#addSuperUser
 * @param user {Blueprint.User} - The user you would like to add
 */
Group.prototype.addSuperUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'super_user', true);
};

/**
 * Remove user from group as super user
 * @function Group#removeSuperUser
 * @param user {Blueprint.User} - The user you would like to remove
 */
Group.prototype.removeSuperUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'super_user', false);
};

/**
 * Add a user id to a group
 * @function Group#addUserWithId
 * @param user {string} - The user id you would like to add
 */
Group.prototype.addUserWithId = function(user) {
  this.modifyUserMembership(user, 'user', true);
};

/**
 * Remove a user id to a group
 * @function Group#removeUserWithId
 * @param user {string} - The user id you would like to remove
 */
Group.prototype.removeUserWithId = function(user) {
  this.modifyUserMembership(user, 'user', false);
};

/**
 * Add user with id as super user
 * @function Group#addSuperUserWithId
 * @param user {string} - The user id you would like to add
 */
Group.prototype.addSuperUserWithId = function(user) {
  this.modifyUserMembership(user, 'super_user', true);
};

/**
 * Remove user with id from super users
 * @function Group#removeSuperUserWithId
 * @param user {string} - The user id you would like to remove
 */
Group.prototype.removeSuperUserWithId = function(user) {
  this.modifyUserMembership(user, 'super_user', false);
};

/**
 * Join a group
 * @function Group#join
 * @param request {object} - The join request
 */
Group.prototype.join = function(request) {
  var promise = new utils.promise();
  var that = this;

  var callback = function(data) {
    that.object = data;
    return promise.send(false, that);
  };

  adapter.Api.post('groups/' + this.get('id') + '/join', {
    group: request
  }, function(response) {
    var data = [];

    if (!response.error) {
      data = response.response.groups[0];
    }

    return callback(data);
  });

  return promise;
};

/**
 * Leave a group
 * @function Group#leave
 */

Group.prototype.leave = function() {
  var promise = new utils.promise();
  var that = this;
  var callback = function(data) {
    that.object = data;
    return promise.send(false, that);
  };

  adapter.Api.post('groups/' + this.get('id') + '/leave', {}, function(response) {
    var data;
    data = [];
    if (response.error) {
    } else {
      data = response.response.groups[0];
    }
    return callback(data);
  });

  return promise;
};

/**
 * Save a group
 * @function Group#save
 * @returns Promise
 */

Group.prototype.save = function() {
  var promise = new utils.promise();
  var that = this;

  var serverObject = {
    group: this.object
  };

  if (this.object && this.object.id) {
    serverObject.id = this.object.id;
  }

  adapter.Records.write('groups', serverObject, function(data) {
    if (typeof data !== void 0) {
      that.object = data;
      return promise.send(false, that);
    }
  });

  return promise;
};

/**
 * Destroy a group
 * @function Group#destroy
 * @returns Promise
 */

Group.prototype.destroy = function() {
  var promise = new utils.promise();

  adapter.Api.post('groups/' + this.get('id') + '/destroy', {}, function(data) {
    if (typeof data !== void 0) {
      return promise.send(false);
    }
  });

  return promise;
};

module.exports = Group;
