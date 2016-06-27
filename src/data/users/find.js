'use strict';

var Adapter = require('../../adapter');
var Utils = require('../../utils');

var User = require('./user');

/**
  * Allows you to get a user by their id
  * @function Blueprint.FindUserById
  * @param id {string} - The id of the user you wish to retrieve
  * @returns Promise
  */

module.exports = function(id) {
  var promise = new Utils.promise();
  var path = 'users/' + id;

  Adapter.Api.post(path, {
    'id': id
  }, function(response) {
    var data = response.response.users[0];
    var user = new User(data);
    promise.send(false, user);
  }, true);

  return promise;
};
