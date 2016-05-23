'use strict';

var Utils = require('../../utils');
var Adapter = require('../../Adapter');
var CurrentUser = require('./current_user');


/**
 * Creates a new user object
 * @name Blueprint.User
 * @class
 * @returns Blueprint.User
 */

var User = function(data) {
  this.isBlueprintObject = true;
  this.endpoint = 'users';
  this.object = data;
  return this;
};

/**
  * Get a value for the user
  * @function Blueprint.User#get
  * @returns Promise
  */

User.prototype.get = function(key) {
  return this.object[key];
};


/**
  * Remove the user from the database
  * @function Blueprint.User#destroy
  * @returns Promise
  */

User.prototype.destroy = function() {

  var promise = new Utils.promise();

  var id = this.get('id');

  Adapter.Records.destroy(this.endpoint, id, function(data) {
    if (data) {
      CurrentUser.GetCurrentUser().then(function(user) {
        if (user.get('id') === id) {
          CurrentUser.Logout();
        }

        promise.send(false);
      }).fail(function() {
        promise.send(false);
      });
    } else {
      promise.send(true);
    }
  });

  return promise;
};

/**
  * Save the user in the database
  * @function Blueprint.User#save
  * @returns Promise
  */

User.prototype.save = function() {
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
      promise.send(false, that);
    }
  });

  return promise;
};

module.exports = User;
