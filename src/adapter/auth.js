
(function() {
  var config, current_user, current_user_loaded, session, setCurrentUser, utils;

  utils = require('../utils');

  config = require('../config');

  session = require('../session');

  current_user = {};

  current_user_loaded = false;

  setCurrentUser = function(user) {
    current_user = user;
    current_user_loaded = true;
    if (current_user['auth_token']) {
      session.set('auth_token', current_user['auth_token']);
      session.set('user_id', current_user['id']);
      return session.set('session_id', current_user['session_id']);
    }
  };

  module.exports = {
    _generate_request: function(request, path, method) {
      request.authorization = {
        user_id: session.get('user_id'),
        guid: this._generate_guid(),
        timestamp: Math.floor((new Date).getTime() / 1000),
        session_id: session.get('session_id')
      };
      request.authorization.signature = this._sign_request(request, path, method, session.get('auth_token'));
      return request;
    },
    _generate_guid: function() {
      var s4;
      s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      };
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    _sign_request: function(request, path, method, auth_token) {
      var string;
      string = request.authorization.timestamp.toString();
      string += request.authorization.guid;
      string += path;
      string += method;
      request.request = this._sort_hash(request.request);
      string += JSON.stringify(request.request);
      return this._sign_string(string, auth_token);
    },
    _sort_hash: function(hash) {
      var key;
      var i, key, keys, new_hash, value;
      keys = [];
      new_hash = {};
      for (key in hash) {
        if (hash.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      keys.sort();
      for (i in keys) {
        key = keys[i];
        value = hash[key];
        if (typeof value === 'object' && value.length === void 0) {
          value = this._sort_hash(value);
        }
        new_hash[key] = value;
      }
      return new_hash;
    },
    _sign_string: function(string, token) {
      var bigInt, hash;
      hash = utils.hmac(string, token);
      bigInt = utils.bigInt.str2bigInt(hash, 16);
      return utils.base58.encodeBigInt(bigInt);
    },
    Authenticate: function(data) {
      var api, promise, request;
      api = require('./api');
      session.clear();
      request = {
        user: {
          email: data.email,
          password: data.password
        }
      };
      if (data.facebook_id) {
        request = {
          user: {
            facebook_id: data.facebook_id,
            facebook_token: data.facebook_token
          }
        };
      }
      promise = new utils.promise;
      api.post('users/Authenticate', request, function(response) {
        if (response === false || response['error']) {
          return promise.send(true);
        } else {
          setCurrentUser(response['response']['users'][0]);
          return promise.send(false, current_user);
        }
      });
      return promise;
    },
    Logout: function() {
      return session.clear();
    },
    RestoreSession: function() {
      if (session.get('auth_token')) {
        return session.get('user_id');
      } else {
        return false;
      }
    },
    CurrentUser: function(callback) {
      var path, that;
      if (typeof callback !== 'undefined') {
        that = this;
        if (current_user_loaded === false) {
          if (typeof session.get('user_id') === 'undefined') {
            return callback(false);
          } else {
            path = 'users/' + session.get('user_id');
            return adapter.Api.post(path, {}, function(response) {
              var data;
              data = response['response']['users'][0];
              that.setCurrentUser(data);
              return callback(data);
            });
          }
        } else {
          return callback(this.current_user);
        }
      } else {
        return current_user;
      }
    },
    setCurrentUser: setCurrentUser,
    generateSignedURLForFile: function(properties) {
      var auth_token, host, session_id, signature, timestamp, url;
      url = '/' + config.get('application_id');
      url += '/' + properties['record_endpoint'];
      url += '/' + properties['record_id'];
      url += '/files';
      url += '/' + properties['file_id'];
      if (session.get('auth_token')) {
        timestamp = Math.floor((new Date).getTime() / 1000 / (24 * 60 * 60));
        session_id = session.get('session_id');
        auth_token = session.get('auth_token');
        signature = this._sign_string(timestamp + properties['file_id'], auth_token);
        url += '?timestamp=' + timestamp;
        url += '&session_id=' + session_id;
        url += '&signature=' + signature;
      }
      host = config.get('protocol') + '://' + config.get('host');
      if (config.get('port') !== 443 && config.get('port') !== 80) {
        host += ':' + config.get('port');
      }
      return host + url;
    }
  };

}).call(this);
