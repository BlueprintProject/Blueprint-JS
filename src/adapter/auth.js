'use strict';

var Utils = require('../utils');
var Config = require('../config');
var Session = require('../session');

var currentUser = {};
var currentUserLoaded = false;

var setCurrentUser = function(user) {
  currentUser = user;
  currentUserLoaded = true;

  // jshint ignore: start

  if (currentUser['auth_token']) {
    Session.set('auth_token', currentUser.auth_token);
    Session.set('user_id', currentUser.id);
    Session.set('session_id', currentUser.session_id);
  }

  // jshint ignore: end
};

var generateRequest = function(request, path, method) {
  request.authorization = {
    'user_id': Session.get('user_id'),
    'guid': this.generateGuid(),
    'timestamp': Math.floor(new Date().getTime() / 1000),
    'session_id': Session.get('session_id')
  };

  request.authorization.signature = this.signRequest(
    request,
    path,
    method,
    Session.get('auth_token')
  );


  return request;
};

var generateGuid = function() {
  var s4;
  s4 = function() {
    return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
  };
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

var signRequest = function(request, path, method, authToken) {
  var string;
  string = request.authorization.timestamp.toString();
  string += request.authorization.guid;
  string += path;
  string += method;
  request.request = this.sortHash(request.request);

  var stringify = require('json-stable-stringify');

  string += stringify(request.request);

  //console.log("[SIGNATURE]", string, request, path, method);

  return this.signString(string, authToken);
};

var sortHash = function(hash) {
  //console.log("Sort", hash);
  if(Object.prototype.toString.call(hash) === '[object Array]' ) {
    var that = this;

    return hash.map(function(object) {
      return that.sortHash(object);
    });
  } else {
    var keys = [];
    var newHash = {};
    for (var hashKey in hash) {
      if (hash.hasOwnProperty(hashKey)) {
        keys.push(hashKey);
      }
    }
    keys.sort();
    for (var i in keys) {
      var key = keys[i];
      var value = hash[key];
      var isHash = typeof value === 'object' && value !== null && value.length === void 0;
      var isArray = Object.prototype.toString.call(hash) === '[object Array]';
      if (isHash || isArray) {
        value = this.sortHash(value);
      }
      newHash[key] = value;
    }

    //console.log("Sorted", newHash);

    return newHash;
  }
};

var signString = function(string, token) {
  var hash = Utils.hmac(string, token);
  var bigInt = Utils.bigInt.str2bigInt(hash, 16);
  return Utils.base58.encodeBigInt(bigInt);
};

var Authenticate = function(data) {
  Session.clear();

  var request = {
    user: {
      email: data.email,
      password: data.password
    }
  };

  if (data.facebookId) {
    request = {
      user: {
        'facebook_id': data.facebookId,
        'facebook_token': data.facebookToken
      }
    };
  }

  var promise = new Utils.promise();
  var Api = require('./api');
  Api.post('users/authenticate', request, function(response) {
    if (response === false || response.error) {
      return promise.send(true);

    } else {
      setCurrentUser(response.response.users[0]);
      return promise.send(false, currentUser);
    }
  });
  return promise;
};

var logout = function() {
  currentUser = undefined;
  currentUserLoaded = false;
  return Session.clear();
};

var RestoreSession = function(callback) {
  if(callback) {
    Session.load(function() {
      if (Session.get('auth_token')) {
        callback(Session.get('user_id'));
      } else {
        callback(false);
      }
    });
  } else {
    if (Session.get('auth_token')) {
      return Session.get('user_id');
    } else {
      return false;
    }
  }
};

var CurrentUser = function(callback) {
  if (typeof callback !== 'undefined') {
    var that = this;
    if (currentUserLoaded === false) {
      if (typeof Session.get('user_id') === 'undefined') {
        callback(false);
      } else {
        var path = 'users/' + Session.get('user_id');
        var Api = require('./api');
        Api.post(path, {}, function(response) {

          try {
            if(typeof response !== 'undefined' &&
               typeof response.response !== 'undefined' &&
              response.response.users.length > 0) {
                 var data = response.response.users[0];
                 that.setCurrentUser(data);
                 callback(data);
            } else {
              logout();
              callback(false);
            }
          } catch(e) {
            logout();
            callback(false);
          }

        });
      }
    } else {
      callback(currentUser);
    }
  } else {
    return currentUser;
  }
};

var generateSignedURLForFile = function(properties) {
  var url = '/' + Config.get('applicationId');
  url += '/' + properties.recordEndpoint;
  url += '/' + properties.recordId;
  url += '/files';
  url += '/' + properties.fileId;
  if (Session.get('auth_token')) {
    var timestamp = Math.floor(new Date().getTime() / 1000 / (24 * 60 * 60));
    var sessionId = Session.get('session_id');
    var authToken = Session.get('auth_token');
    var signature = this.signString(timestamp + properties.fileId, authToken);
    url += '?timestamp=' + timestamp;
    url += '&session_id=' + sessionId;
    url += '&signature=' + signature;
  }
  var host = Config.get('protocol') + '://' + Config.get('host');
  if (Config.get('port') !== 443 && Config.get('port') !== 80) {
    host += ':' + Config.get('port');
  }
  return host + url;
};

module.exports = {
  generateRequest: generateRequest,
  generateGuid: generateGuid,
  generateSignedURLForFile: generateSignedURLForFile,

  sortHash: sortHash,

  signString: signString,
  signRequest: signRequest,

  Authenticate: Authenticate,
  RestoreSession: RestoreSession,

  setCurrentUser: setCurrentUser,

  CurrentUser: CurrentUser,
  Logout: logout,
};
