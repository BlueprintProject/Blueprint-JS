
(function() {
  var auth, create, current_user, utils;

  auth = require('../../adapter/auth');

  create = require('./create');

  utils = require('../../utils');

  current_user = void 0;

  module.exports = function() {
    var promise;
    promise = new utils.promise;
    if (typeof current_user === 'undefined') {
      Auth.CurrentUser(function(current_user_data) {
        if (current_user_data === false) {
          return promise.send(true);
        } else {
          current_user = create.createUser(current_user_data);
          return promise.send(false, current_user);
        }
      });
    } else {
      promise.send(false, current_user);
    }
    return promise;
  };

}).call(this);
