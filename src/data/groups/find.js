'use strict';

var Session = require('../../session');
var Config = require('../../config');
var Group = require('./group');

module.exports.PrivateGroup = function() {
  return new Group({
    id: Session.get('user_id')
  });
};

module.exports.PublicGroup = function() {
  return new Group({
    id: Config.get('applicationId')
  });
};

module.exports.GroupWithId = function(id) {
  return new Group({
    id: id
  });
};
