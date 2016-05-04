
(function() {
  var adapter, create, utils;

  adapter = require('../../adapter');

  utils = require('../../utils');

  create = require('./create');

  module.exports = function(id) {
    var path, promise;
    promise = new utils.promise;
    path = 'users/' + id;
    adapter.Api.post(path, parameters, function(response) {
      var data, user;
      data = response['response']['users'][0];
      user = create.createUser(data);
      return promise.send(false, user);
    });
    return promise;
  };

}).call(this);
