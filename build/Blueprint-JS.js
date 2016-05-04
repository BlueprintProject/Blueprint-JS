(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

(function() {
  var auth, bulk_request_incremental_timer, bulk_request_master_timer, bulk_requests, config, session, utils;

  config = require(5);

  utils = require(32);

  auth = require(2);

  session = require(26);

  bulk_requests = [];

  bulk_request_master_timer = void 0;

  bulk_request_incremental_timer = void 0;

  module.exports = {
    post: function(path, data, callback) {
      var options;
      options = this._build_options('POST', path, data);
      return this._send_request_allow_bulk(options, data, callback);
    },
    put: function(path, data, callback) {
      var options;
      options = this._build_options('PUT', path, data);
      return this._send_request(options, data, callback);
    },
    _default_options: function() {
      return {
        host: config.get('host'),
        port: config.get('port'),
        protocol: config.get('protocol') + ':',
        headers: {
          'Content-Type': 'application/json'
        }
      };
    },
    _build_options: function(method, path, data) {
      return utils.extend({}, this._default_options(), {
        method: method,
        path: '/' + config.get('application_id') + '/' + path
      });
    },

    _send_request: function(options, data, callback) {
      var post_data;
      post_data = {
        request: data
      };
      if (session.get('auth_token')) {
        post_data = Auth._generate_request(post_data, options.path, options.method);
      }
      options['data'] = post_data;
      return utils.http.send(options, function(data) {
        if (callback) {
          if (typeof data === 'undefined') {
            return callback({
              error: 1
            });
          } else {
            return callback(data);
          }
        }
      });
    },

    _send_request_allow_bulk: function(options, data, callback) {

      var that

      that = this;

      bulk_request_master_timer = setTimeout(function() {
        bulk_request_master_timer = undefined;
        that._send_bulk_request()
      }, 250)

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer);
        bulk_request_incremental_timer = undefined;
      }

      bulk_request_incremental_timer = setTimeout(function() {
        bulk_request_incremental_timer = undefined;
        that._send_bulk_request.call(that)
      }, 50)

      bulk_requests.push({
        options: options,
        data: data,
        callback: callback
      })

    },

    _send_bulk_request: function() {

      var handling_bulk_requests = []
      var guids = []

      for(var i in bulk_requests) {
        var guid = require(2)._generate_guid()

        handling_bulk_requests[i] = bulk_requests[i];
        guids.push(guid)
      }

      bulk_requests = [];

      if(bulk_request_master_timer) {
        clearTimeout(bulk_request_master_timer);
        bulk_request_master_timer = undefined;
      }

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer);
        bulk_request_incremental_timer = undefined;
      }

      var callbacks = {};

      if(handling_bulk_requests.length > 1) {

        var formatted_requests = []

        for(var i in guids) {
          var guid = guids[i]

          var request = handling_bulk_requests[i];

          formatted_requests.push({
            endpoint: request["options"]["path"].split("/")[2],
            request: request["data"],
            guid: guid
          })

          callbacks[guid] = request.callback
        }


        var data = {requests: formatted_requests};
        var options = this._build_options("POST", "bulk_query", data)
        this._send_request(options, data, function(data) {
          if(data && !data["error"]) {
            for(var guid in data["response"]) {
              var response = data["response"][guid];

              var callback = callbacks[guid]
              var meta = {};

              callback({"error":false,"meta":meta,"response": response})
            }
          } else {
            for(var i in copied_bulk_requests) {
              var request = copied_bulk_requests[i]
              request["callback"]({error: 1})
            }
          }

        })

      } else if(handling_bulk_requests[0]) {
        var request = handling_bulk_requests[0];
        this._send_request(request.options, request.data, request.callback)
      }

    }


  };

}).call(this);

},{"2":2,"26":26,"32":32,"5":5}],2:[function(require,module,exports){

(function() {
  var config, current_user, current_user_loaded, session, setCurrentUser, utils;

  utils = require(32);

  config = require(5);

  session = require(26);

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
      api = require(1);
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

},{"1":1,"26":26,"32":32,"5":5}],3:[function(require,module,exports){

(function() {
  module.exports = {
    Records: require(4),
    Auth: require(2),
    Api: require(1)
  };

}).call(this);

},{"1":1,"2":2,"4":4}],4:[function(require,module,exports){

(function() {
  var api;

  api = require(1);

  module.exports = {
    write: function(model_name, data, callback) {
      return this.write_with_custom_path(model_name, model_name, data, callback);
    },
    trigger: function(model_name, id, callback) {
      var response_callback;
      response_callback = function(response) {
        return callback({});
      };
      return api.put(model_name + '/' + id + '/trigger', {}, response_callback);
    },
    write_with_custom_path: function(path, model_name, data, callback) {
      var request, response_callback;
      request = data;
      response_callback = function(response) {
        var data;
        data = {};
        if (response.error) {

        } else {
          data = response['response'][model_name][0];
        }
        return callback(data);
      };
      if (data.id) {
        return api.put(path + '/' + data.id, request, response_callback);
      } else {
        return api.post(path, request, response_callback);
      }
    },
    destroy: function(model_name, id, callback) {
      return this.destroy_with_custom_path(model_name, model_name, id, callback);
    },
    destroy_with_custom_path: function(path, model_name, id, callback) {
      var response_callback;
      response_callback = function(response) {
        var data;
        data = {};
        if (response.error) {

        } else {
          data = true;
        }
        return callback(data);
      };
      return api.post(path + '/' + id + '/destroy', {}, response_callback);
    },
    query: function(model_name, query, callback) {
      var request, response_callback;
      request = {
        'where': query
      };
      response_callback = function(response) {
        var data;
        data = [];
        if (response.error) {

        } else {
          data = response['response'][model_name];
        }
        return callback(data, response['meta']);
      };
      return api.post(model_name + '/query', request, response_callback);
    }
  };

}).call(this);

},{"1":1}],5:[function(require,module,exports){

(function() {
  var config, extend, init;

  extend = require(29);

  config = {
    host: 'localhost',
    protocol: 'http',
    port: 8080,
    application_id: '000000000000000000000001'
  };

  module.exports.config = config;

  init = function(config) {
    return config = extend(module.exports.config, config);
  };

  module.exports.init = init;

  module.exports.get = function(key) {
    return module.exports.config[key];
  };

}).call(this);

},{"29":29}],6:[function(require,module,exports){

(function() {
  var file;

  file = require(7);

  module.exports = function(properties, record, data) {
    return new file(properties, record, data);
  };

}).call(this);

},{"7":7}],7:[function(require,module,exports){

(function() {
  var adapter, file, record, utils;

  record = require(19);

  utils = require(32);

  adapter = require(3);

  file = record.extend(function(properties, record, data) {
    this.__is_blueprint_object = true;
    this._endpoint = record._endpoint;
    properties['record_id'] = record.get('id');
    if (data && properties['size'] === void 0) {
      properties['size'] = data.length;
    }
    this._data = data;
    this._object = properties;
    return this;
  });

  file.prototype.get = function(key) {
    return this._object[key];
  };

  file.prototype.save = function() {
    var path, promise, that;
    promise = new utils.promise;
    that = this;
    path = this._endpoint + '/' + this.get('record_id') + '/files';
    adapter.Records.write_with_custom_path(path, 'files', {
      file: this._object
    }, function(data) {
      var form_data, key, params, req, value, xmlhttp;
      if (typeof data !== void 0) {
        that._object = data;
        req = data['upload_request'];
        params = req['params'];
        params['file'] = that._data;
        form_data = new FormData;
        for (key in params) {
          value = params[key];
          form_data.append(key, value);
        }
        if (window.XMLHttpRequest) {
          xmlhttp = new XMLHttpRequest;
        } else {
          xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState === 4) {
            return promise.send(false, that);
          }
        };
        xmlhttp.open('post', req['url']);
        return xmlhttp.send(form_data);
      }
    });
    return promise;
  };

  file.prototype["delete"] = function() {
    var path, promise, that;
    promise = new utils.promise;
    that = this;
    path = this._endpoint + '/' + this.get('record_id') + '/files';
    adapter.Records.destroy_with_custom_path(path, 'files', this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  file.prototype.getURL = function() {
    var file;
    file = {
      file_id: this.get('id'),
      record_id: this.get('record_id'),
      record_endpoint: this._endpoint
    };
    return adapter.Auth.generateSignedURLForFile(file);
  };

  module.exports = file;

}).call(this);

},{"19":19,"3":3,"32":32}],8:[function(require,module,exports){

(function() {
  var Create;

  Create = require(6);

  module.exports.createFile = Create;

}).call(this);

},{"6":6}],9:[function(require,module,exports){

(function() {
  var group;

  group = require(11);

  module.exports = function(properties) {
    return new group(properties);
  };

}).call(this);

},{"11":11}],10:[function(require,module,exports){

(function() {
  var config, group, session;

  session = require(26);

  config = require(5);

  group = require(11);

  module.exports.PublicGroup = function() {
    return new group({
      id: session.get('user_id')
    });
  };

  module.exports.PublicGroup = function() {
    return new group({
      id: config.get('application_id')
    });
  };

  module.exports.GroupWithId = function(id) {
    return new group({
      id: id
    });
  };

}).call(this);

},{"11":11,"26":26,"5":5}],11:[function(require,module,exports){

(function() {
  var adapter, utils;

  adapter = require(3);

  utils = require(32);

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

},{"3":3,"32":32}],12:[function(require,module,exports){

(function() {
  var Create, Find;

  Find = require(10);

  Create = require(9);

  module.exports.CreateGroup = Create;

  module.exports.PublicGroup = Find.PublicGroup;

  module.exports.PublicGroup = Find.PublicGroup;

  module.exports.GroupWithId = Find.GroupWithId;

}).call(this);

},{"10":10,"9":9}],13:[function(require,module,exports){

(function() {
  var CustomEndpoints, Data, Files, Groups, Records, Users;

  Records = require(18);

  Groups = require(12);

  Users = require(23);

  Files = require(8);

  Data = {};

  Data.CreateRecord = Records.create;

  Data.Find = Records.find.Find;

  Data.FindOne = Records.find.FindOne;

  Data.record = Records.record;

  Data.CreateGroup = Groups.CreateGroup;

  Data.PublicGroup = Groups.PublicGroup;

  Data.PublicGroup = Groups.PublicGroup;

  Data.GroupWithId = Groups.GroupWithId;

  Data.CurrentUser = Users.CurrentUser;

  Data.Register = Users.Register;

  Data.Model = require(14);

  module.exports = Data;

}).call(this);

},{"12":12,"14":14,"18":18,"23":23,"8":8}],14:[function(require,module,exports){

(function() {
  module.exports = require(15);

}).call(this);

},{"15":15}],15:[function(require,module,exports){

(function() {
  var modelify;

  modelify = function(records, inject) {
    var modeled_records;
    if (records.__is_blueprint_object) {
      inject(records);
      return records;
    } else {
      modeled_records = [];
      records.forEach(function(v, i) {
        inject(v);
        return modeled_records.push(v);
      });
      return modeled_records;
    }
  };

  module.exports = function(name, instance_code) {
    var constructor, inject, utils;
    utils = require(32);
    inject = function(obj) {
      obj.update = function(data) {
        var key, results1, value;
        results1 = [];
        for (key in data) {
          value = data[key];
          results1.push(obj.set(key, value));
        }
        return results1;
      };
      return instance_code.call(obj);
    };
    constructor = function(base_data) {
      var object;
      object = modelify(require(18).create(name, {}), inject);
      if (base_data) {
        object.update(base_data);
      }
      return object;
    };
    constructor.find = function(where) {
      var promise;
      promise = new utils.promise;
      require(17).Find(name, where).then(function(results) {
        results = modelify(results, inject);
        return promise.send(void 0, results);
      }).fail(function(error) {
        return promise.send(error);
      });
      return promise;
    };
    constructor.findOne = function(where) {
      var promise;
      promise = new utils.promise;
      require(17).FindOne(name, where).then(function(result) {
        result = modelify(result, inject);
        return promise.send(void 0, result);
      }).fail(function(error) {
        return promise.send(error);
      });
      return promise;
    };
    return constructor;
  };

}).call(this);

},{"17":17,"18":18,"32":32}],16:[function(require,module,exports){

(function() {
  var record;

  record = require(19);

  module.exports = function(model, content) {
    return new record(model, {
      content: content
    });
  };

}).call(this);

},{"19":19}],17:[function(require,module,exports){

(function() {
  var adapter, FindOne, Find, record, utils;

  record = require(19);

  utils = require(32);

  adapter = require(3);

  Find = function(model, query) {
    var promise;
    promise = new utils.promise;
    adapter.Records.query(model, query, function(data, meta) {
      var i, object, objects;
      objects = [];
      if (data) {
        i = 0;
        while (i < data.length) {
          object = data[i];
          object = new record(model, object);
          objects.push(object);
          i++;
        }
      }
      return promise.send(false, objects, meta);
    });
    return promise;
  };

  FindOne = function(model, query) {
    var promise;
    promise = new utils.promise;
    adapter.Records.query(model, query, function(data, meta) {
      var object;
      object = null;
      if (data) {
        object = new record(model, data[0]);
      }
      return promise.send(false, object, meta);
    });
    return promise;
  };

  module.exports.Find = Find;

  module.exports.FindOne = FindOne;

}).call(this);

},{"19":19,"3":3,"32":32}],18:[function(require,module,exports){

(function() {
  module.exports.find = require(17);

  module.exports.create = require(16);

  module.exports.record = require(19);

}).call(this);

},{"16":16,"17":17,"19":19}],19:[function(require,module,exports){

(function() {
  var adapter, record, utils;

  utils = require(32);

  adapter = require(3);

  record = function(endpoint, data) {
    var f, file, i, index, key, keys;
    this.__is_blueprint_object = true;
    this.__no_content_root = false;
    this._endpoint = endpoint;
    this._object = data;
    this._files = {};
    if (typeof this._object.permissions === 'undefined') {
      this._object.permissions = {};
    }
    keys = ['read', 'write', 'destroy'];
    for (index in keys) {
      if (!isNaN(parseInt(index))) {
        key = keys[index] + '_group_ids';
        if (typeof this._object.permissions[key] === 'undefined') {
          this._object.permissions[key] = [];
        }
      }
    }
    if (typeof data['files'] !== 'undefined') {
      for (i in data['files']) {
        file = require(8);
        f = data['files'][i];
        this._files[f['name']] = new file.createFile(f, this);
      }
    }
    return this;
  };

  record.prototype._addGroup = function(type, group) {
    var group_id, key;
    group_id = group.get('id');
    key = type + '_group_ids';
    return this._object.permissions[key].push(group_id);
  };

  record.prototype._removeGroup = function(type, group) {
    var group_id, index, key;
    group_id = group.get('id');
    key = type + '_group_ids';
    if (typeof this._object.permissions === 'object') {
      if (typeof this._object.permissions[key] === 'object') {
        index = this._object.permissions[key].indexOf(group_id);
        if (index !== -1) {
          return this._object.permissions[key].splice(index, 1);
        }
      }
    }
  };

  record.prototype.set = function(key, value) {
    return this._object.content[key] = value;
  };

  record.prototype.get = function(key) {
    if (key === 'id') {
      return this._object[key];
    } else if (this.__no_content_root) {
      return this._object[key];
    } else {
      return this._object.content[key];
    }
  };

  record.prototype.addReadGroup = function(group) {
    return this._addGroup('read', group);
  };

  record.prototype.addWriteGroup = function(group) {
    return this._addGroup('write', group);
  };

  record.prototype.addDestroyGroup = function(group) {
    return this._addGroup('destroy', group);
  };

  record.prototype.removeReadGroup = function(group) {
    return this._removeGroup('read', group);
  };

  record.prototype.removeWriteGroup = function(group) {
    return this._removeGroup('write', group);
  };

  record.prototype.removeDestroyGroup = function(group) {
    return this._removeGroup('destroy', group);
  };

  record.prototype.save = function() {
    var data, promise, that;
    promise = new utils.promise;
    that = this;
    data = {
      id: this._object['id'],
      content: this._object['content'],
      permissions: this._object['permissions']
    };
    if (this._object['user']) {
      data['user'] = this._object['user'];
    }
    adapter.Records.write(this._endpoint, data, function(data) {
      if (typeof data !== void 0) {
        that._object = data;
        return promise.send(false, that);
      }
    });
    return promise;
  };

  record.prototype["delete"] = function() {
    var promise, that;
    promise = new utils.promise;
    that = this;
    adapter.Records.destroy(this._endpoint, this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  record.prototype.trigger = function() {
    var promise, that;
    promise = new utils.promise;
    that = this;
    adapter.Records.trigger(this._endpoint, this.get('id'), function(data) {
      if (typeof data !== void 0) {
        return promise.send(false);
      }
    });
    return promise;
  };

  record.prototype.createFile = function(properties, data) {
    var files;
    files = require(8);
    return files.createFile(properties, this, data);
  };

  record.prototype.getFileWithName = function(file_name) {
    return this._files[file_name];
  };

  record.extend = function(object) {
    object.prototype = utils.extend(object.prototype, record.prototype);
    return object;
  };

  module.exports = record;

}).call(this);

},{"3":3,"32":32,"8":8}],20:[function(require,module,exports){

(function() {
  var createUser, Register, session, user, utils;

  user = require(24);

  session = require(3);

  utils = require(32);

  createUser = function(properties) {
    return new user(properties);
  };

  Register = function(properties) {
    var user;
    var promise;
    promise = new utils.promise;
    user = createUser({
      user: properties
    });
    user.save().then(function(error, user) {
      if (!error) {
        adapter.Auth.setCurrentUser(user._object);
      }
      return promise.send(error, user);
    });
    return promise;
  };

  module.exports = {
    createUser: createUser,
    Register: Register
  };

}).call(this);

},{"24":24,"3":3,"32":32}],21:[function(require,module,exports){

(function() {
  var auth, create, current_user, utils;

  auth = require(2);

  create = require(20);

  utils = require(32);

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

},{"2":2,"20":20,"32":32}],22:[function(require,module,exports){

(function() {
  var adapter, create, utils;

  adapter = require(3);

  utils = require(32);

  create = require(20);

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

},{"20":20,"3":3,"32":32}],23:[function(require,module,exports){

(function() {
  var Create, CurrentUser, Find;

  Create = require(20);

  CurrentUser = require(21);

  Find = require(22);

  module.exports = {
    createUser: Create.createUser,
    Register: Create.Register,
    CurrentUser: CurrentUser,
    findUserById: Find
  };

}).call(this);

},{"20":20,"21":21,"22":22}],24:[function(require,module,exports){

(function() {
  var record, user;

  record = require(19);

  user = record.extend(function(data) {
    this.__is_blueprint_object = true;
    this._endpoint = 'users';
    this._object = data;
    return this;
  });

  user.prototype.get = function(key) {
    return this._object[key];
  };

  module.exports = user;

}).call(this);

},{"19":19}],25:[function(require,module,exports){

(function() {
  var Adapter, Blueprint, Config, Data;

  Data = require(13);

  Adapter = require(3);

  Config = require(5);

  // Base Structure
  Blueprint = {};
  Blueprint.Data = {};


  Blueprint.Init = Config.init;

  // Groups
  Blueprint.PublicGroup = Data.PublicGroup;
  Blueprint.PrivateGroup = Data.PublicGroup;
  Blueprint.CreateGroup = Data.CreateGroup;
  Blueprint.GroupWithId = Data.GroupWithId;

  // Data
  Blueprint.Data.CreateRecord = Data.CreateRecord;
  Blueprint.Data.Find = Data.Find;
  Blueprint.Data.FindOne = Data.FindOne;

  // Models
  Blueprint.Model = Data.Model;

  // User
  Blueprint.CurrentUser = Data.CurrentUser;
  Blueprint.Register = Data.Register;

  // Sessions
  Blueprint.Authenticate = Adapter.Auth.Authenticate;
  Blueprint.RestoreSession = Adapter.Auth.RestoreSession;
  Blueprint.Logout = Adapter.Auth.Logout;

  Blueprint.setCurrentUser = Adapter.Auth.setCurrentUser;

  if (typeof window !== 'undefined') {
    if (typeof window.Blueprint === 'undefined') {
      window.Blueprint = Blueprint;
    } else {
      module.exports = Blueprint;
    }
  } else {
    module.exports = Blueprint;
  }

}).call(this);

},{"13":13,"3":3,"5":5}],26:[function(require,module,exports){

(function() {
  var __session, getSession, saveSession, storageClear, storageGet, storageSet;

  __session = void 0;

  storageGet = function() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('__api_session');
    } else {
      return __session;
    }
  };

  storageSet = function(value) {
    if (typeof window !== 'undefined') {
      return window.localStorage.setItem('__api_session', value);
    } else {
      return __session = value;
    }
  };

  storageClear = function() {
    if (typeof window !== 'undefined') {
      return window.localStorage.removeItem('__api_session');
    } else {
      return __session = void 0;
    }
  };

  getSession = function() {
    var session, session_text;
    session_text = storageGet();
    session = void 0;
    if (typeof session_text !== 'undefined') {
      session = JSON.parse(session_text);
    }
    if (session) {
      return session;
    } else {
      return {};
    }
  };

  saveSession = function(session) {
    var session_text;
    session_text = JSON.stringify(session);
    return storageSet(session_text);
  };

  module.exports = {
    get: function(key) {
      var session;
      session = getSession();
      return session[key];
    },
    set: function(key, value) {
      var session;
      session = getSession();
      session[key] = value;
      return saveSession(session);
    },
    clear: function() {
      return storageClear();
    }
  };

}).call(this);

},{}],27:[function(require,module,exports){

(function() {
  module.exports = (function(alpha) {
    var alphabet, base;
    alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    base = alphabet.length;
    return {
      encodeBigInt: function(enc) {
        var bigBase, bigInt, encoded, remainder, zero;
        bigInt = require(28);
        zero = bigInt.int2bigInt(0, 10);
        remainder = Array(enc.length);
        bigBase = bigInt.int2bigInt(base, 10);
        encoded = '';
        while (parseInt(bigInt.bigInt2str(enc, 10))) {
          bigInt.divide(enc, bigBase, enc, remainder);
          encoded = alphabet[parseInt(bigInt.bigInt2str(remainder, 10))].toString() + encoded;
        }
        return encoded;
      }
    };
  })();

}).call(this);

},{"28":28}],28:[function(require,module,exports){
digitsStr = '0123456789abcdef';
for (bpe = 0;
  (1 << (bpe + 1)) > (1 << bpe); bpe++);
bpe >>= 1;
mask = (1 << bpe) - 1;
radix = (1 << bpe) + 1;
s6 = new Array(0)

function negative(x) {
  return ((x[x.length - 1] >> (bpe - 1)) & 1);
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function greaterShift(x, y, shift) {
  var i, kx = x.length,
    ky = y.length;

  var k = ((kx + shift) < ky) ? (kx + shift) : ky;
  for (i = ky - 1 - shift; i < kx && i >= 0; i++)
    if (x[i] > 0)
      return 1; //if there are nonzeros in x to the left of the first column of y, then x is bigger
  for (i = kx - 1 + shift; i < ky; i++)
    if (y[i] > 0)
      return 0; //if there are nonzeros in y to the left of the first column of x, then x is not bigger
  for (i = k - 1; i >= shift; i--)
    if (x[i - shift] > y[i]) return 1;
    else
  if (x[i - shift] < y[i]) return 0;
  return 0;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function divide_(x, y, q, r) {
  var kx, ky;
  var i, j, y1, y2, c, a, b;
  copy_(r, x);
  for (ky = y.length; y[ky - 1] == 0; ky--); //ky is number of elements in y, not including leading zeros

  //normalize: ensure the most significant element of y has its highest bit set
  b = y[ky - 1];
  for (a = 0; b; a++)
    b >>= 1;
  a = bpe - a; //a is how many bits to shift so that the high order bit of y is leftmost in its array element
  leftShift_(y, a); //multiply both by 1<<a now, then divide both by that at the end
  leftShift_(r, a);

  //Rob Visser discovered a bug: the following line was originally just before the normalization.
  for (kx = r.length; r[kx - 1] == 0 && kx > ky; kx--); //kx is number of elements in normalized x, not including leading zeros

  copyInt_(q, 0); // q=0
  while (!greaterShift(y, r, kx - ky)) { // while (leftShift_(y,kx-ky) <= r) {
    subShift_(r, y, kx - ky); //   r=r-leftShift_(y,kx-ky)
    q[kx - ky]++; //   q[kx-ky]++;
  } // }

  for (i = kx - 1; i >= ky; i--) {
    if (r[i] == y[ky - 1])
      q[i - ky] = mask;
    else
      q[i - ky] = Math.floor((r[i] * radix + r[i - 1]) / y[ky - 1]);

    //The following for(;;) loop is equivalent to the commented while loop,
    //except that the uncommented version avoids overflow.
    //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
    //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
    //    q[i-ky]--;
    for (;;) {
      y2 = (ky > 1 ? y[ky - 2] : 0) * q[i - ky];
      c = y2 >> bpe;
      y2 = y2 & mask;
      y1 = c + q[i - ky] * y[ky - 1];
      c = y1 >> bpe;
      y1 = y1 & mask;

      if (c == r[i] ? y1 == r[i - 1] ? y2 > (i > 1 ? r[i - 2] : 0) : y1 > r[i - 1] : c > r[i])
        q[i - ky]--;
      else
        break;
    }

    linCombShift_(r, y, -q[i - ky], i - ky); //r=r-q[i-ky]*leftShift_(y,i-ky)
    if (negative(r)) {
      addShift_(r, y, i - ky); //r=r+leftShift_(y,i-ky)
      q[i - ky]--;
    }
  }

  rightShift_(y, a); //undo the normalization step
  rightShift_(r, a); //undo the normalization step
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function int2bigInt(t, bits, minSize) {
  var i, k;
  k = Math.ceil(bits / bpe) + 1;
  k = minSize > k ? minSize : k;
  var buff = new Array(k);
  copyInt_(buff, t);
  return buff;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function str2bigInt(s, base, minSize) {
  var d, i, j, x, y, kk;
  var k = s.length;
  if (base == -1) { //comma-separated list of array elements in decimal
    x = new Array(0);
    for (;;) {
      y = new Array(x.length + 1);
      for (i = 0; i < x.length; i++)
        y[i + 1] = x[i];
      y[0] = parseInt(s, 10);
      x = y;
      d = s.indexOf(',', 0);
      if (d < 1)
        break;
      s = s.substring(d + 1);
      if (s.length == 0)
        break;
    }
    if (x.length < minSize) {
      y = new Array(minSize);
      copy_(y, x);
      return y;
    }
    return x;
  }

  x = int2bigInt(0, base * k, 0);
  for (i = 0; i < k; i++) {
    d = digitsStr.indexOf(s.substring(i, i + 1), 0);
    if (base <= 36 && d >= 36) //convert lowercase to uppercase if base<=36
      d -= 26;
    if (d >= base || d < 0) { //stop at first illegal character
      break;
    }
    multInt_(x, base);
    addInt_(x, d);
  }

  for (k = x.length; k > 0 && !x[k - 1]; k--); //strip off leading zeros
  k = minSize > k + 1 ? minSize : k + 1;
  y = new Array(k);
  kk = k < x.length ? k : x.length;
  for (i = 0; i < kk; i++)
    y[i] = x[i];
  for (; i < k; i++)
    y[i] = 0;
  return y;
}

function isZero(x) {
  var i;
  for (i = 0; i < x.length; i++)
    if (x[i])
      return 0;
  return 1;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function bigInt2str(x, base) {
  var i, t, s = "";

  if (s6.length != x.length)
    s6 = dup(x);
  else
    copy_(s6, x);

  if (base == -1) { //return the list of array contents
    for (i = x.length - 1; i > 0; i--)
      s += x[i] + ',';
    s += x[0];
  } else { //return it in the given base
    while (!isZero(s6)) {
      t = divInt_(s6, base); //t=s6 % base; s6=floor(s6/base);
      s = digitsStr.substring(t, t + 1) + s;
    }
  }
  if (s.length == 0)
    s = "0";
  return s;
}

function dup(x) {
  var i;
  var buff = new Array(x.length);
  copy_(buff, x);
  return buff;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function copy_(x, y) {
  var i;
  var k = x.length < y.length ? x.length : y.length;
  for (i = 0; i < k; i++)
    x[i] = y[i];
  for (i = k; i < x.length; i++)
    x[i] = 0;
}

function copyInt_(x, n) {
  var i, c;
  for (c = n, i = 0; i < x.length; i++) {
    x[i] = c & mask;
    c >>= bpe;
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function addInt_(x, n) {
  var i, k, c, b;
  x[0] += n;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i];
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
    if (!c) return; //stop carrying as soon as the carry is zero
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function rightShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = 0; i < x.length - k; i++) //right shift x by k elements
      x[i] = x[i + k];
    for (; i < x.length; i++)
      x[i] = 0;
    n %= bpe;
  }
  for (i = 0; i < x.length - 1; i++) {
    x[i] = mask & ((x[i + 1] << (bpe - n)) | (x[i] >> n));
  }
  x[i] >>= n;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function leftShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = x.length; i >= k; i--) //left shift x by k elements
      x[i] = x[i - k];
    for (; i >= 0; i--)
      x[i] = 0;
    n %= bpe;
  }
  if (!n)
    return;
  for (i = x.length - 1; i > 0; i--) {
    x[i] = mask & ((x[i] << n) | (x[i - 1] >> (bpe - n)));
  }
  x[i] = mask & (x[i] << n);
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function multInt_(x, n) {
  var i, k, c, b;
  if (!n)
    return;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i] * n;
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
  }
}

function divInt_(x, n) {
  var i, r = 0,
    s;
  for (i = x.length - 1; i >= 0; i--) {
    s = r * radix + x[i];
    x[i] = Math.floor(s / n);
    r = s % n;
  }
  return r;
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function linCombShift_(x, y, b, ys) {
  var i, c, k, kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] + b * y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }

  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}

/* istanbul ignore next: The code missed in tests will not be used in production */
function subShift_(x, y, ys) {
  var i, c, k, kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] - y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }

  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}

module.exports = {
  divide: divide_,
  int2bigInt: int2bigInt,
  str2bigInt: str2bigInt,
  bigInt2str: bigInt2str
}

},{}],29:[function(require,module,exports){

(function() {
  module.exports = function(target) {
    var sources;
    sources = [].slice.call(arguments, 1);
    sources.forEach(function(source) {
      var prop, results;
      results = [];
      for (prop in source) {
        results.push(target[prop] = source[prop]);
      }
      return results;
    });
    return target;
  };

}).call(this);

},{}],30:[function(require,module,exports){

(function() {


}).call(this);

},{}],31:[function(require,module,exports){

(function() {
  module.exports = {
    send: function(options, callback, retry_count) {
      var data, handle, handleRetry, handled, that, url, xmlhttp;
      xmlhttp = void 0;
      url = this._build_url(options);
      data = JSON.stringify(options['data']);
      handleRetry = function() {
        if (retry_count >= 2 || options['method'] !== 'POST') {
          return callback();
        } else {
          return that.send(options, callback, retry_count + 1);
        }
      };
      handle = function(data) {
        var handled, json;
        if (!handled) {
          handled = true;
          if (data === null || typeof data === 'undefined' || data === '') {
            return handleRetry();
          } else {
            json = JSON.parse(data);
            if (json['error']) {
              return handleRetry();
            } else {
              return callback(json);
            }
          }
        }
      };
      if (typeof retry_count === 'undefined') {
        retry_count = 0;
      }
      that = this;
      handled = false;

      /* istanbul ignore else */
      if (typeof window === 'undefined') {
        return require('./node_request')(options, data, handle);
      } else {
        if (window.XMLHttpRequest) {
          xmlhttp = new XMLHttpRequest;
        } else {
          xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xmlhttp.onreadystatechange = function() {
          if (xmlhttp.readyState === 4) {
            return handle(xmlhttp.responseText);
          }
        };
        xmlhttp.onerror = function() {
          return handle();
        };
        xmlhttp.open(options['method'], url);
        xmlhttp.setRequestHeader('Content-type', 'application/json');
        return xmlhttp.send(data);
      }
    },
    _build_url: function(options) {
      var url;
      url = options['protocol'];
      url += '//';
      url += options['host'];
      url += ':' + options['port'];
      url += options['path'];
      return url;
    }
  };

}).call(this);

},{"undefined":undefined}],32:[function(require,module,exports){

(function() {
  module.exports = {
    base58: require(27),
    hmac: require(30),
    bigInt: require(28),
    extend: require(29),
    http: require(31),
    promise: require(33)
  };

}).call(this);

},{"27":27,"28":28,"29":29,"30":30,"31":31,"33":33}],33:[function(require,module,exports){

(function() {
  var promise;

  promise = function() {
    this.sent = false;
    this.error = false;
    this.data = void 0;
    this.meta = void 0;
    this.success_callbacks = [];
    this.error_callbacks = [];
    this.send = function(error, data, meta) {
      var callbacks, i, response, results;
      this.error = error;
      this.data = data;
      this.sent = true;
      if (meta) {
        this.meta = meta;
      }
      callbacks = this.success_callbacks;
      response = this.data;
      if (this.error) {
        callbacks = this.error_callbacks;
        response = this.error;
      }
      results = [];
      for (i in callbacks) {
        results.push(callbacks[i](response, this.meta));
      }
      return results;
    };
    this.fail = function(new_callback) {
      this.error_callbacks.push(new_callback);
      if (this.sent === true) {
        if (this.error) {
          new_callback(this.error, this.meta);
        }
      }
      return this;
    };
    this.then = function(new_callback) {
      this.success_callbacks.push(new_callback);
      if (this.sent === true) {
        if (this.data) {
          new_callback(this.data, this.meta);
        }
      }
      return this;
    };
    return this;
  };

  module.exports = promise;

}).call(this);

},{}]},{},[25]);
