var utils = require('../utils')
var config = require('../config.js')
var session = require('../session.js')

var current_user = {}
var current_user_loaded = false

var setCurrentUser = function(user) {
  current_user = user;
  current_user_loaded = true
  if (current_user["auth_token"]) {
    session.set("auth_token", current_user["auth_token"])
    session.set("user_id", current_user["id"])
    session.set("session_id", current_user["session_id"])
  }
}

module.exports = {

  //
  // Low Level Methods
  //

  _generate_request: function(request, path, method) {
    request.authorization = {
      user_id: session.get("user_id"),
      guid: this._generate_guid(),
      timestamp: Math.floor((new Date().getTime()) / 1000),
      session_id: session.get("session_id")
    }

    request.authorization.signature = this._sign_request(request, path,
      method, session.get("auth_token"))

    return request
  },

  _generate_guid: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  },

  _sign_request: function(request, path, method, auth_token) {
    var string = request.authorization.timestamp.toString()
    string += request.authorization.guid
    string += path
    string += method

    request.request = this._sort_hash(request.request)

    string += JSON.stringify(request.request)

    return this._sign_string(string, auth_token)
  },

  _sort_hash: function(hash) {
    var keys = [];
    var new_hash = {};
    for (var key in hash) {
      if (hash.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    keys.sort();
    for (var i in keys) {
      var key = keys[i];
      var value = hash[key];

      if (typeof value == "object" && value.length == undefined) {
        value = this._sort_hash(value)
      }

      new_hash[key] = value;
    }

    return new_hash
  },

  _sign_string: function(string, token) {
    var hash = utils.hmac(string, token)
    var bigInt = utils.bigInt.str2bigInt(hash, 16);
    return utils.base58.encodeBigInt(bigInt)
  },

  //
  // Public Methods
  //

  authenticate: function(data) {
    var api = require('./api.js')

    session.clear()

    var request = {
      user: {
        email: data.email,
        password: data.password
      }
    }

    if (data.facebook_id) {
      request = {
        user: {
          facebook_id: data.facebook_id,
          facebook_token: data.facebook_token
        }
      }
    }

    var promise = new utils.promise
    api.post("users/authenticate", request, function(response) {
      if (response == false || response["error"]) {
        promise.send(true)
      } else {
        setCurrentUser(response["response"]["users"][0])
        promise.send(false, current_user)
      }
    })

    return promise
  },

  logout: function() {
    session.clear()
      //callback(false)
  },

  restoreSession: function() {
    if (session.get("auth_token")) {
      return session.get("user_id")
    } else {
      return false
    }
  },

  getCurrentUser: function(callback) {
    if (typeof callback !== "undefined") {
      var that = this
      if (current_user_loaded == false) {
        if (typeof session.get("user_id") === "undefined") {
          callback(false)
        } else {
          var path = "users/" + session.get("user_id")
          adapter.api.post(path, {}, function(response) {
            data = response["response"]["users"][0]
            that.setCurrentUser(data)
            callback(data)
          })
        }
      } else {
        callback(this.current_user)
      }
    } else {
      return current_user
    }
  },

  setCurrentUser: setCurrentUser,

  generateSignedURLForFile: function(properties) {
    var url = "/" + config.get("application_id")
    url += "/" + properties["record_endpoint"]
    url += "/" + properties["record_id"]
    url += "/files"
    url += "/" + properties["file_id"]

    if (session.get("auth_token")) {
      var timestamp = Math.floor((new Date().getTime()) / 1000 / (24 * 60 * 60))
      var session_id = session.get("session_id")
      var auth_token = session.get("auth_token")
      var signature = this._sign_string(timestamp + properties["file_id"],
        auth_token)

      url += "?timestamp=" + timestamp
      url += "&session_id=" + session_id
      url += "&signature=" + signature
    }

    var host = config.get("protocol") + "://" + config.get("host")

    if (config.get("port") != 443 && config.get("port") != 80) {
      host += ":" + config.get("port")
    }

    return host + url
  }
}
