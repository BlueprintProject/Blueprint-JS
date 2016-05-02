(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var config = require(5)
var utils = require(34)
var auth = require(2)
var session = require(28)


var bulk_requests = [];
var bulk_request_master_timer;
var bulk_request_incremental_timer;


module.exports = {

  //
  // Basic Public HTTP Functions
  //

  post: function(path, data, callback) {
    var options = this._build_options("POST", path, data)
    this._send_request_allow_bulk(options, data, callback)
  },

  put: function(path, data, callback) {
    var options = this._build_options("PUT", path, data)
    this._send_request(options, data, callback)
  },

  //
  // Low Level Methods
  //

  _default_options: function(){
    return {
      host: config.get("host"),
      port: config.get("port"),
      protocol: config.get("protocol") + ":",
      headers: {
          'Content-Type': 'application/json'
      }
    }
  },

  _build_options: function(method, path, data) {
    return utils.extend({}, this._default_options(), {
      method: method,
      path: "/" + config.get("application_id") + "/" + path
    })
  },

  //

  //
  // Low Level HTTP Request
  //

  _send_request: function(options, data, callback) {
    var post_data = {
      request: data
    }

    if(session.get("auth_token")) {
      post_data = auth._generate_request(post_data, options.path, options.method)
    }

    options["data"] = post_data
    utils.http.send(options, function(data) {
      if(callback) {
        if(typeof data === "undefined") {
          callback({error: 1})
        } else {
          callback(data)
        }
      }
    });
  },

  _send_request_allow_bulk: function(options, data, callback) {
    var path_components = options["path"].split("/")
    var last_component = path_components[path_components.length - 1]

    if(last_component == "query") {
      bulk_requests.push({
        options: options,
        data: data,
        callback: callback})
      var that = this;

      if(!bulk_request_master_timer) {
        bulk_request_master_timer = setTimeout(function() {
          bulk_request_master_timer = undefined;
          that._send_bulk_request()
        }, 250)
      }

      if(bulk_request_incremental_timer) {
        clearTimeout(bulk_request_incremental_timer)
      }

      bulk_request_incremental_timer = setTimeout(function() {
        bulk_request_incremental_timer = undefined;
        that._send_bulk_request()
      }, 50)

    } else {
      this._send_request(options, data, callback)
    }
  },

  _send_bulk_request: function() {
    if(bulk_request_master_timer) {
      clearTimeout(bulk_request_master_timer);
      bulk_request_master_timer = undefined;
    }

    if(bulk_request_incremental_timer) {
      clearTimeout(bulk_request_incremental_timer);
      bulk_request_incremental_timer = undefined;
    }

    var copied_bulk_requests = [];

    for(var i in bulk_requests) {
      copied_bulk_requests.push(bulk_requests[i])
    }

    bulk_requests = [];

    var formatted_requests = [];
    for(var i in copied_bulk_requests) {
      var request = copied_bulk_requests[i];

      formatted_requests.push({
        endpoint: request["options"]["path"].split("/")[1],
        request: request["data"],
        guid: i
      })

      var data = {requests: formatted_requests};
      var options = this._build_options("POST", "bulk_query", data)
      this._send_request(options, data, function(data) {
        if(data && !data["error"]) {
          for(var i in data["response"]) {
            var response = data["reponse"][i];
            var callback = formatted_requests[i]["callback"]
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
    }

  }

}

},{"2":2,"28":28,"34":34,"5":5}],2:[function(require,module,exports){
var utils = require(34)
var config = require(5)
var session = require(28)

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
    var api = require(1)

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

},{"1":1,"28":28,"34":34,"5":5}],3:[function(require,module,exports){
module.exports = {
  records: require(4),
  auth: require(2),
  api: require(1)
}

},{"1":1,"2":2,"4":4}],4:[function(require,module,exports){
var api = require(1)

module.exports = {

  write: function(model_name, data, callback) {
    this.write_with_custom_path(model_name, model_name, data, callback)
  },

  trigger: function(model_name, id, callback) {
    var response_callback = function(response) {
      callback({});
    }

    api.put(model_name + "/" + id + "/trigger", {}, response_callback)
  },

  write_with_custom_path: function(path, model_name, data, callback) {
    var request = data

    var response_callback = function(response) {
      var data = {};
      if (response.error) {

      } else {
        data = response["response"][model_name][0]
      }

      callback(data);
    }

    if (data.id) {
      api.put(path + "/" + data.id, request, response_callback)
    } else {
      api.post(path, request, response_callback)
    }
  },

  destroy: function(model_name, id, callback) {
    this.destroy_with_custom_path(model_name, model_name, id, callback)
  },

  destroy_with_custom_path: function(path, model_name, id, callback) {
    var response_callback = function(response) {
      var data = {};
      if (response.error) {

      } else {
        data = true
      }

      callback(data);
    }

    api.post(path + "/" + id + "/destroy", {}, response_callback)
  },

  query: function(model_name, query, callback) {
    var request = {
      "where": query
    }

    var response_callback = function(response) {
      var data = [];
      if (response.error) {} else {
        data = response["response"][model_name]
      }
      callback(data, response["meta"]);
    }

    api.post(model_name + "/query", request, response_callback)
  }

}

},{"1":1}],5:[function(require,module,exports){
var extend = require(31)

var config = {
  host: "localhost",
  protocol: "http",
  port: 8080,
  application_id: "5543850719b6366c23000001"
}

module.exports.config = config

var init = function(config) {
  config = extend(module.exports.config, config)
}

module.exports.init = init
module.exports.get = function(key) {
  return module.exports.config[key]
}

},{"31":31}],6:[function(require,module,exports){
module.exports = {
  perform: require(7)
}

},{"7":7}],7:[function(require,module,exports){
var adapter = require(3)
var utils = require(34)

module.exports = function(name, parameters) {
  var path = "custom_endpoints/" + name
  var promise = new utils.promise
  adapter.api.post(path, parameters, function(response){
    data = response["response"][name]

    promise.send(false, data)
  })

  return promise
}

},{"3":3,"34":34}],8:[function(require,module,exports){
var file = require(9)

module.exports = function(properties, record, data) {
  return new file(properties, record, data)
}

},{"9":9}],9:[function(require,module,exports){
var record = require(21)

var utils = require(34)
var adapter = require(3)

var file = record.extend(function(properties, record, data) {
  this.__is_blueprint_object = true

  this._endpoint = record._endpoint

  properties["record_id"] = record.get("id")

  if (data && properties["size"] == undefined) {
    properties["size"] = data.length
  }

  this._data = data;
  this._object = properties

  //console.log(properties)

  return this
})

file.prototype.get = function(key) {
  return this._object[key]
}

file.prototype.save = function() {
  var promise = new utils.promise
    //var data = JSON.stringify(this._object)
  var that = this
  var path = this._endpoint + "/" + this.get("record_id") + "/files"

  adapter.records.write_with_custom_path(path, "files", {
    file: this._object
  }, function(data) {
    if (typeof data != undefined) {
      that._object = data

      var req = data["upload_request"]

      var params = req["params"]

      params["file"] = that._data;

      var form_data = new FormData();

      for(var key in params) {
        var value = params[key]
        form_data.append(key, value)
      }

      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
          promise.send(false, that)
        }
      }

      xmlhttp.open("post", req["url"]);
      xmlhttp.send(form_data);

    }
  })


  return promise
}

file.prototype.delete = function() {
  var promise = new utils.promise
    //var data = JSON.stringify(this._object)
  var that = this
  var path = this._endpoint + "/" + this.get("record_id") + "/files"

  adapter.records.destroy_with_custom_path(path, "files", this.get("id"),
    function(data) {
      if (typeof data != undefined) {
        promise.send(false)
      }
    })

  return promise
}

file.prototype.getURL = function() {
  var file = {
    file_id: this.get("id"),
    record_id: this.get("record_id"),
    record_endpoint: this._endpoint
  }

  return adapter.auth.generateSignedURLForFile(file)
}

module.exports = file

},{"21":21,"3":3,"34":34}],10:[function(require,module,exports){
//var Find = require("./find.js")
var Create = require(8)

module.exports.createFile = Create

},{"8":8}],11:[function(require,module,exports){
var group = require(13)

module.exports = function(properties) {
  return new group(properties)
}

},{"13":13}],12:[function(require,module,exports){
var session = require(28)
var config = require(5)
var group = require(13)

module.exports.getPrivateGroup = function() {
  return new group({
    id:session.get("user_id")
  })
}

module.exports.getPublicGroup = function() {
  return new group({
    id:config.get("application_id")
  })
}

module.exports.groupWithId = function(id) {
	return new group({
		id: id
	})
}
},{"13":13,"28":28,"5":5}],13:[function(require,module,exports){
adapter = require(3)
utils = require(34)

module.exports = function(properties) {
  this.__is_blueprint_object = true

  this._object = properties

  this._modifyUserMembership = function(user_id, type, adding) {
    var action, inverse_action, key, inverse_key

    if(adding) {
      action = "add"
      inverse_action = "remove"
    } else {
      action = "remove"
      inverse_action = "add"
    }

    key = action + "_" + type + "_ids"
    inverse_key = inverse_action + "_" + type + "_ids"

    if(typeof this._object[key] === "undefined") {
      this._object[key] = []
    }

    if(this._object[key].indexOf(user_id) == -1) {
      this._object[key].push(user_id)
    }

    if(typeof this._object[inverse_key] === "object") {
      var index = this._object[inverse_key].indexOf(user_id)
      if(index != -1) {
        this._object[inverse_key].splice(index, 1)
      }
    }

  }

  // Access Methods

  this.get = function(key) {
    return this._object[key]
  }

  this.set = function(key, value) {
    this._object[key] = value
  }

  this.addUser = function(user) {
    this._modifyUserMembership(user.get("id"), "user", true)
  }

  this.removeUser = function(user) {
    this._modifyUserMembership(user.get("id"), "user", false)
  }

  this.addSuperUser = function(user) {
    this._modifyUserMembership(user.get("id"), "super_user", true)
  }

  this.removeSuperUser = function(user) {
    this._modifyUserMembership(user.get("id"), "super_user", false)
  }

  this.addUserWithId = function(user) {
    this._modifyUserMembership(user, "user", true)
  }

  this.removeUserWithId = function(user) {
    this._modifyUserMembership(user, "user", false)
  }

  this.addSuperUserWithId = function(user) {
    this._modifyUserMembership(user, "super_user", true)
  }

  this.removeSuperUserWithId = function(user) {
    this._modifyUserMembership(user, "super_user", false)
  }

  this.join = function(request) {
    var promise = new utils.promise
    var that = this

    var callback = function(data) {
      that._object = data
      promise.send(false, that)
    }

    adapter.api.post("groups/" + this.get("id") + "/join", {group:request}, function(response) {
      var data = [];
      if(response.error) {

      } else {
        data = response["response"]["groups"][0]
      }
      callback(data);
    })

    return promise
  }

  this.leave = function() {
    var promise = new utils.promise
    var that = this

    var callback = function(data) {
      that._object = data
      promise.send(false, that)
    }

    adapter.api.post("groups/" + this.get("id") + "/leave", {}, function(response) {
      var data = [];
      if(response.error) {

      } else {
        data = response["response"]["groups"][0]
      }
      callback(data);
    })

    return promise
  }

  this.save = function() {
    var promise = new utils.promise
    //var data = JSON.stringify(this._object)
    var that = this

    adapter.records.write("groups", this._object, function(data) {
      if(typeof data != undefined) {
        that._object = data
        promise.send(false, that)
      }
    })

    return promise
  }

  this.delete = function() {
    var promise = new utils.promise
    var that = this
    adapter.api.post("groups/" + this.get("id") + "/destroy", {}, function(data) {
      if(typeof data != undefined) {
        promise.send(false)
      }
    })

    return promise
  }

  return this
}

},{"3":3,"34":34}],14:[function(require,module,exports){
var Find = require(12)
var Create = require(11)

module.exports.createGroup = Create

module.exports.getPublicGroup  = Find.getPublicGroup
module.exports.getPrivateGroup = Find.getPrivateGroup
module.exports.groupWithId		= Find.groupWithId
},{"11":11,"12":12}],15:[function(require,module,exports){
var Records = require(20)
var Groups = require(14)
var Users = require(25)
var Files = require(10)
var CustomEndpoints = require(6)
var Data = {}

Data.createRecord = Records.create
Data.findRecords = Records.find.findRecords
Data.findRecord = Records.find.findRecord
Data.record = Records.record

Data.createGroup = Groups.createGroup
Data.getPublicGroup = Groups.getPublicGroup
Data.getPrivateGroup = Groups.getPrivateGroup
Data.groupWithId = Groups.groupWithId

Data.getCurrentUser = Users.getCurrentUser
Data.registerUser = Users.registerUser

Data.performEndpoint = CustomEndpoints.perform

Data.model = require(16)

module.exports = Data

},{"10":10,"14":14,"16":16,"20":20,"25":25,"6":6}],16:[function(require,module,exports){
module.exports = require(17)

},{"17":17}],17:[function(require,module,exports){
var modelify = function(records, inject) {
  if(records.__is_blueprint_object) {
    inject(records);
    return records;
  } else {
    var modeled_records = [];

    records.forEach(function(v, i) {
      inject(v);
      modeled_records.push(v);
    })

    return modeled_records;
  }
}

module.exports = function(name, instance_code) {
  var utils = require(34);

  this.instance_code = instance_code

  var inject = function(obj) {
    obj.update = function(data) {
      for(var key in data) {
        var value = data[key];
        obj.set(key, value);
      }
    }

    instance_code.call(obj);
  };

  this.create = function(base_data) {
    var object = modelify(require(20).create(name, {}), inject);

    if(base_data) {
      object.update(base_data);
    }

    return object;
  };

  this.findRecords = function(where) {
    var promise = new utils.promise

    require(19).findRecords(name, where).then(function(error, results) {
      if(results) {
        results = modelify(results, inject)
      }

      promise.send(error, results);
    });

    return promise;
  };

  this.findRecord = function(where) {
    var promise = new utils.promise

    require(19).findRecords(name, where).then(function(error, result) {
      if(result) {
        result = modelify(result, inject)
      }

      promise.send(error, result);
    });

    return promise;
  };

  return this;
}

},{"19":19,"20":20,"34":34}],18:[function(require,module,exports){
var record = require(21)

module.exports = function(model, content) {
  return new record(model, {content:content})
}

},{"21":21}],19:[function(require,module,exports){
var record = require(21)
var utils = require(34)
var adapter = require(3)


var findRecords = function(model, query) {
  var promise = new utils.promise

  adapter.records.query(model, query, function(data, meta) {

    var objects = []
    if (data) {
      for (var i = 0; i < data.length; i++) {
        var object = data[i];
        object = new record(model, object)
        objects.push(object)
      }
    }

    promise.send(false, objects, meta)
  })

  return promise
}

var findRecord = function(model, query) {
  var promise = new utils.promise

  adapter.records.query(model, query, function(data, meta) {
    var object = null;
    if (data) {
      object = new record(model, data[0])
    }
    promise.send(false, object, meta)
  })

  return promise
}

module.exports.findRecords = findRecords;
module.exports.findRecord = findRecord;

},{"21":21,"3":3,"34":34}],20:[function(require,module,exports){
module.exports.find = require(19)
module.exports.create = require(18)
module.exports.record = require(21)

},{"18":18,"19":19,"21":21}],21:[function(require,module,exports){
var utils = require(34)
var adapter = require(3)

var record = function(endpoint, data) {
  this.__is_blueprint_object = true
  this.__no_content_root = false
  this._endpoint = endpoint
  this._object = data
  this._files = {};

  // Create the default permissions
  if (typeof this._object.permissions === "undefined") {
    this._object.permissions = {}
  }

  var keys = ["read", "write", "destroy"]
  for (var index in keys) {
    if (!isNaN(parseInt(index))) {
      var key = keys[index] + "_group_ids"

      if (typeof this._object.permissions[key] === "undefined") {
        this._object.permissions[key] = []
      }
    }
  }

  if (typeof data["files"] !== "undefined") {
    for (var i in data["files"]) {
      var file = require(10)
      var f = data["files"][i]
      this._files[f["name"]] = new file.createFile(f, this)
    }
  }

  return this
}

record.prototype._addGroup = function(type, group) {
  var group_id = group.get("id")
  var key = type + "_group_ids"


  this._object.permissions[key].push(group_id)
}

record.prototype._removeGroup = function(type, group) {
  var group_id = group.get("id")
  var key = type + "_group_ids"

  if (typeof this._object.permissions === "object") {
    if (typeof this._object.permissions[key] === "object") {
      var index = this._object.permissions[key].indexOf(group_id)
      if (index != -1) {
        this._object.permissions[key].splice(index, 1)
      }
    }
  }
}


// Public Methods

record.prototype.set = function(key, value) {
  this._object.content[key] = value
}

record.prototype.get = function(key) {
  if (key == "id") {
    return this._object[key]
  } else if (this.__no_content_root) {
    return this._object[key]
  } else {
    return this._object.content[key]
  }
}

record.prototype.addReadGroup = function(group) {
  this._addGroup("read", group)
}

record.prototype.addWriteGroup = function(group) {
  this._addGroup("write", group)
}

record.prototype.addDestroyGroup = function(group) {
  this._addGroup("destroy", group)
}


record.prototype.removeReadGroup = function(group) {
  this._removeGroup("read", group)
}

record.prototype.removeWriteGroup = function(group) {
  this._removeGroup("write", group)
}

record.prototype.removeDestroyGroup = function(group) {
  this._removeGroup("destroy", group)
}

record.prototype.save = function() {
  var promise = new utils.promise
    //var data = JSON.stringify(this._object)
  var that = this;

  var data = {
    id: this._object["id"],
    content: this._object["content"],
    permissions: this._object["permissions"]
  }

  if(this._object["user"]) {
    data["user"] = this._object["user"]
  }

  adapter.records.write(this._endpoint, data, function(data) {
    if (typeof data != undefined) {
      that._object = data
      promise.send(false, that)
    }
  });
  return promise
}

record.prototype.delete = function() {
  var promise = new utils.promise
  var that = this

  adapter.records.destroy(this._endpoint, this.get("id"), function(data) {
    if (typeof data != undefined) {
      promise.send(false)
    }
  })

  return promise
}

record.prototype.trigger = function() {
  var promise = new utils.promise
  var that = this

  adapter.records.trigger(this._endpoint, this.get("id"), function(data) {
    if (typeof data != undefined) {
      promise.send(false)
    }
  })

  return promise
}

record.prototype.createFile = function(properties, data) {
  var files = require(10)

  return files.createFile(properties, this, data)
}

record.prototype.getFileWithName = function(file_name) {
  return this._files[file_name]
}

record.extend = function(object) {
  object.prototype = utils.extend(object.prototype, record.prototype)
  return object
}

module.exports = record

},{"10":10,"3":3,"34":34}],22:[function(require,module,exports){
var user = require(26)
var session = require(3)
var utils = require(34)

var createUser = function(properties) {
  return new user(properties)
}

var registerUser = function(properties) {
  var promise = new utils.promise
  var user = createUser({user:properties})
  user.save().then(function(error, user) {
    if(!error) {
      adapter.auth.setCurrentUser(user._object)
    }
    promise.send(error, user)
  })

  return promise
}

module.exports = {
    createUser: createUser,
    registerUser: registerUser
}

},{"26":26,"3":3,"34":34}],23:[function(require,module,exports){
var auth = require(2)
var create = require(22)
var utils = require(34)

var current_user = undefined

module.exports = function() {
  var promise = new utils.promise

  if(typeof current_user === "undefined") {
    auth.getCurrentUser(function(current_user_data) {
      if(current_user_data == false) {
        //console.log("This is a test")
        promise.send(true)
      } else {
        current_user = create.createUser(current_user_data)
        promise.send(false, current_user)
      }
    })
  } else {
    //console.log("Has current user")
    promise.send(false, current_user)
  }

  return promise
}

},{"2":2,"22":22,"34":34}],24:[function(require,module,exports){
var adapter = require(3)
var utils = require(34)
var create = require(22)

module.exports = function(id) {
  var promise = new utils.promise

  var path = "users/" + id
  adapter.api.post(path, parameters, function(response){
    data = response["response"]["users"][0]
    user = create.createUser(data)
    promise.send(false, user)
  })

  return promise
}

},{"22":22,"3":3,"34":34}],25:[function(require,module,exports){
var Create = require(22)
var CurrentUser = require(23)
var Find = require(24)

module.exports = {
  createUser: Create.createUser,
  registerUser: Create.registerUser,
  getCurrentUser: CurrentUser,
  findUserById: Find
}

},{"22":22,"23":23,"24":24}],26:[function(require,module,exports){
var record = require(21)

var user = record.extend(function(data) {
  this.__is_blueprint_object = true

  this._endpoint = "users"
  this._object = data

  return this
})

user.prototype.get = function(key) {
  return this._object[key]
}

module.exports = user

},{"21":21}],27:[function(require,module,exports){
Data = require(15)
Adapter = require(3)
Config = require(5)

var Blueprint = {}

// Config
Blueprint.Init = Config.init;
//Blueprint.Config = Config.config;

// Groups
Blueprint.getPublicGroup = Data.getPublicGroup;
Blueprint.getPrivateGroup = Data.getPrivateGroup;
Blueprint.createGroup = Data.createGroup;
Blueprint.groupWithId = Data.groupWithId;

// Data
Blueprint.createRecord = Data.createRecord;
Blueprint.findRecords = Data.findRecords;
Blueprint.findRecord = Data.findRecord;
Blueprint.record = Data.record;

Blueprint.model = Data.model

// Users
Blueprint.getCurrentUser = Data.getCurrentUser;

// Custom Endpoints
Blueprint.performEndpoint = Data.performEndpoint;


Blueprint.Register = Data.registerUser;
Blueprint.Authenticate = Adapter.auth.authenticate;
Blueprint.Logout = Adapter.auth.logout;
Blueprint.RestoreSession = Adapter.auth.restoreSession;

Blueprint.Adapter = Adapter;

Blueprint.setCurrentUser = Adapter.auth.setCurrentUser;

Blueprint.__utilities = require(34)

if (typeof window !== 'undefined') {
  if(typeof window.Blueprint === 'undefined') {
    window.Blueprint = Blueprint;
  } else {
    module.exports = Blueprint;
  }
} else {
  module.exports = Blueprint;
}

},{"15":15,"3":3,"34":34,"5":5}],28:[function(require,module,exports){
var __session = undefined;

function storageGet() {
  if(typeof window !== "undefined") {
    return window.localStorage.getItem("__api_session")
  } else {
    return __session
  }
}

function storageSet(value) {
  if(typeof window !== "undefined") {
    window.localStorage.setItem("__api_session", value)
  } else {
    __session = value
  }
}

function storageClear() {
  if(typeof window !== "undefined") {
    window.localStorage.removeItem("__api_session")
  } else {
    __session = undefined
  }
}

function getSession() {
  var session_text = storageGet()
  var session = undefined
  if(typeof session_text !== "undefined") {
    session = JSON.parse(session_text)
  }

  if(session) {
    return session
  } else {
    return {}
  }
}

function saveSession(session) {
  var session_text = JSON.stringify(session)
  storageSet(session_text);
}

module.exports = {
  get: function(key) {
    var session = getSession()
    return session[key];
  },

  set: function(key, value) {
    var session = getSession()
    session[key] = value;
    saveSession(session);
  },

  clear: function() {
    storageClear()
  }
}

},{}],29:[function(require,module,exports){
module.exports = (function(alpha) {
  var alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    base = alphabet.length;
  return {
    encodeBigInt: function(enc) {
      var bigInt = require(30)
      var zero = bigInt.int2bigInt(0, 10);
      var remainder = Array(enc.length)
      var bigBase = bigInt.int2bigInt(base, 10);

      var encoded = '';
      while (parseInt(bigInt.bigInt2str(enc, 10))) {
        bigInt.divide(enc, bigBase, enc, remainder)
        encoded = alphabet[parseInt(bigInt.bigInt2str(remainder, 10))].toString() + encoded;
      }
      return encoded;
    }
  };
})();

},{"30":30}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
module.exports = function(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
      for (var prop in source) {
          target[prop] = source[prop];
      }
  });
  return target;
}
},{}],32:[function(require,module,exports){
/*
Modified for Blueprint by Hunter Dolan 2015

CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/

module.exports = function(data, key) {

  var CryptoJS = CryptoJS || function(h, s) {
      var f = {},
          g = f.lib = {},
          q = function() {},
          m = g.Base = {
              extend: function(a) {
                  q.prototype = this;
                  var c = new q;
                  a && c.mixIn(a);
                  c.hasOwnProperty("init") || (c.init = function() {
                      c.$super.init.apply(this, arguments)
                  });
                  c.init.prototype = c;
                  c.$super = this;
                  return c
              },
              create: function() {
                  var a = this.extend();
                  a.init.apply(a, arguments);
                  return a
              },
              init: function() {},
              mixIn: function(a) {
                  for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
                  a.hasOwnProperty("toString") && (this.toString = a.toString)
              },
              clone: function() {
                  return this.init.prototype.extend(this)
              }
          },
          r = g.WordArray = m.extend({
              init: function(a, c) {
                  a = this.words = a || [];
                  this.sigBytes = c != s ? c : 4 * a.length
              },
              toString: function(a) {
                  return (a || k).stringify(this)
              },
              concat: function(a) {
                  var c = this.words,
                      d = a.words,
                      b = this.sigBytes;
                  a = a.sigBytes;
                  this.clamp();
                  if (b % 4)
                      for (var e = 0; e < a; e++) c[b + e >>> 2] |= (d[e >>> 2] >>> 24 - 8 * (e % 4) & 255) << 24 - 8 * ((b + e) % 4);
                  else if (65535 < d.length)
                      for (e = 0; e < a; e += 4) c[b + e >>> 2] = d[e >>> 2];
                  else c.push.apply(c, d);
                  this.sigBytes += a;
                  return this
              },
              clamp: function() {
                  var a = this.words,
                      c = this.sigBytes;
                  a[c >>> 2] &= 4294967295 <<
                      32 - 8 * (c % 4);
                  a.length = h.ceil(c / 4)
              },
              clone: function() {
                  var a = m.clone.call(this);
                  a.words = this.words.slice(0);
                  return a
              },
              random: function(a) {
                  for (var c = [], d = 0; d < a; d += 4) c.push(4294967296 * h.random() | 0);
                  return new r.init(c, a)
              }
          }),
          l = f.enc = {},
          k = l.Hex = {
              stringify: function(a) {
                  var c = a.words;
                  a = a.sigBytes;
                  for (var d = [], b = 0; b < a; b++) {
                      var e = c[b >>> 2] >>> 24 - 8 * (b % 4) & 255;
                      d.push((e >>> 4).toString(16));
                      d.push((e & 15).toString(16))
                  }
                  return d.join("")
              },
              parse: function(a) {
                  for (var c = a.length, d = [], b = 0; b < c; b += 2) d[b >>> 3] |= parseInt(a.substr(b,
                      2), 16) << 24 - 4 * (b % 8);
                  return new r.init(d, c / 2)
              }
          },
          n = l.Latin1 = {
              stringify: function(a) {
                  var c = a.words;
                  a = a.sigBytes;
                  for (var d = [], b = 0; b < a; b++) d.push(String.fromCharCode(c[b >>> 2] >>> 24 - 8 * (b % 4) & 255));
                  return d.join("")
              },
              parse: function(a) {
                  for (var c = a.length, d = [], b = 0; b < c; b++) d[b >>> 2] |= (a.charCodeAt(b) & 255) << 24 - 8 * (b % 4);
                  return new r.init(d, c)
              }
          },
          j = l.Utf8 = {
              stringify: function(a) {
                  try {
                      return decodeURIComponent(escape(n.stringify(a)))
                  } catch (c) {
                      throw Error("Malformed UTF-8 data");
                  }
              },
              parse: function(a) {
                  return n.parse(unescape(encodeURIComponent(a)))
              }
          },
          u = g.BufferedBlockAlgorithm = m.extend({
              reset: function() {
                  this._data = new r.init;
                  this._nDataBytes = 0
              },
              _append: function(a) {
                  "string" == typeof a && (a = j.parse(a));
                  this._data.concat(a);
                  this._nDataBytes += a.sigBytes
              },
              _process: function(a) {
                  var c = this._data,
                      d = c.words,
                      b = c.sigBytes,
                      e = this.blockSize,
                      f = b / (4 * e),
                      f = a ? h.ceil(f) : h.max((f | 0) - this._minBufferSize, 0);
                  a = f * e;
                  b = h.min(4 * a, b);
                  if (a) {
                      for (var g = 0; g < a; g += e) this._doProcessBlock(d, g);
                      g = d.splice(0, a);
                      c.sigBytes -= b
                  }
                  return new r.init(g, b)
              },
              clone: function() {
                  var a = m.clone.call(this);
                  a._data = this._data.clone();
                  return a
              },
              _minBufferSize: 0
          });
      g.Hasher = u.extend({
          cfg: m.extend(),
          init: function(a) {
              this.cfg = this.cfg.extend(a);
              this.reset()
          },
          reset: function() {
              u.reset.call(this);
              this._doReset()
          },
          update: function(a) {
              this._append(a);
              this._process();
              return this
          },
          finalize: function(a) {
              a && this._append(a);
              return this._doFinalize()
          },
          blockSize: 16,
          _createHelper: function(a) {
              return function(c, d) {
                  return (new a.init(d)).finalize(c)
              }
          },
          _createHmacHelper: function(a) {
              return function(c, d) {
                  return (new t.HMAC.init(a,
                      d)).finalize(c)
              }
          }
      });
      var t = f.algo = {};
      return f
  }(Math);
  (function(h) {
      for (var s = CryptoJS, f = s.lib, g = f.WordArray, q = f.Hasher, f = s.algo, m = [], r = [], l = function(a) {
              return 4294967296 * (a - (a | 0)) | 0
          }, k = 2, n = 0; 64 > n;) {
          var j;
          a: {
              j = k;
              for (var u = h.sqrt(j), t = 2; t <= u; t++)
                  if (!(j % t)) {
                      j = !1;
                      break a
                  }
              j = !0
          }
          j && (8 > n && (m[n] = l(h.pow(k, 0.5))), r[n] = l(h.pow(k, 1 / 3)), n++);
          k++
      }
      var a = [],
          f = f.SHA256 = q.extend({
              _doReset: function() {
                  this._hash = new g.init(m.slice(0))
              },
              _doProcessBlock: function(c, d) {
                  for (var b = this._hash.words, e = b[0], f = b[1], g = b[2], j = b[3], h = b[4], m = b[5], n = b[6], q = b[7], p = 0; 64 > p; p++) {
                      if (16 > p) a[p] =
                          c[d + p] | 0;
                      else {
                          var k = a[p - 15],
                              l = a[p - 2];
                          a[p] = ((k << 25 | k >>> 7) ^ (k << 14 | k >>> 18) ^ k >>> 3) + a[p - 7] + ((l << 15 | l >>> 17) ^ (l << 13 | l >>> 19) ^ l >>> 10) + a[p - 16]
                      }
                      k = q + ((h << 26 | h >>> 6) ^ (h << 21 | h >>> 11) ^ (h << 7 | h >>> 25)) + (h & m ^ ~h & n) + r[p] + a[p];
                      l = ((e << 30 | e >>> 2) ^ (e << 19 | e >>> 13) ^ (e << 10 | e >>> 22)) + (e & f ^ e & g ^ f & g);
                      q = n;
                      n = m;
                      m = h;
                      h = j + k | 0;
                      j = g;
                      g = f;
                      f = e;
                      e = k + l | 0
                  }
                  b[0] = b[0] + e | 0;
                  b[1] = b[1] + f | 0;
                  b[2] = b[2] + g | 0;
                  b[3] = b[3] + j | 0;
                  b[4] = b[4] + h | 0;
                  b[5] = b[5] + m | 0;
                  b[6] = b[6] + n | 0;
                  b[7] = b[7] + q | 0
              },
              _doFinalize: function() {
                  var a = this._data,
                      d = a.words,
                      b = 8 * this._nDataBytes,
                      e = 8 * a.sigBytes;
                  d[e >>> 5] |= 128 << 24 - e % 32;
                  d[(e + 64 >>> 9 << 4) + 14] = h.floor(b / 4294967296);
                  d[(e + 64 >>> 9 << 4) + 15] = b;
                  a.sigBytes = 4 * d.length;
                  this._process();
                  return this._hash
              },
              clone: function() {
                  var a = q.clone.call(this);
                  a._hash = this._hash.clone();
                  return a
              }
          });
      s.SHA256 = q._createHelper(f);
      s.HmacSHA256 = q._createHmacHelper(f)
  })(Math);
  (function() {
      var h = CryptoJS,
          s = h.enc.Utf8;
      h.algo.HMAC = h.lib.Base.extend({
          init: function(f, g) {
              f = this._hasher = new f.init;
              "string" == typeof g && (g = s.parse(g));
              var h = f.blockSize,
                  m = 4 * h;
              g.sigBytes > m && (g = f.finalize(g));
              g.clamp();
              for (var r = this._oKey = g.clone(), l = this._iKey = g.clone(), k = r.words, n = l.words, j = 0; j < h; j++) k[j] ^= 1549556828, n[j] ^= 909522486;
              r.sigBytes = l.sigBytes = m;
              this.reset()
          },
          reset: function() {
              var f = this._hasher;
              f.reset();
              f.update(this._iKey)
          },
          update: function(f) {
              this._hasher.update(f);
              return this
          },
          finalize: function(f) {
              var g =
                  this._hasher;
              f = g.finalize(f);
              g.reset();
              return g.finalize(this._oKey.clone().concat(f))
          }
      })
  })();


  return CryptoJS.HmacSHA256(data, key).toString()
}

},{}],33:[function(require,module,exports){
module.exports = {
  send: function(options, callback, retry_count) {
    var xmlhttp;

    var url = this._build_url(options)
    var data = JSON.stringify(options["data"])

    if(typeof retry_count === 'undefined') {
      retry_count = 0;
    }

    var that = this;
    var handled = false;

    function handleRetry() {
      if(retry_count >= 2 || options["method"] != "POST") {
        callback()
      } else {
        that.send(options, callback, retry_count + 1)
      }
    }

    function handle(data) {
      if(!handled) {
        handled = true;
        if(data == null || typeof data === 'undefined' || data == "") {
          handleRetry();
        } else {
          try {
            var json = JSON.parse(data)
            if(json["error"]) {
              handleRetry()
            } else {
              callback(data)
            }
          } catch (e) {
            handleRetry()
          }
        }
      }
    }

    /* istanbul ignore else  */
    if (typeof window === "undefined") {
      require("./node_request.js")(options, data, handle)
    } else {
      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
          handle(xmlhttp.responseText)
        }
      }

      xmlhttp.onerror = function() {
        handle()
      }

      xmlhttp.open(options["method"], url);
      xmlhttp.setRequestHeader("Content-type", "application/json");

      xmlhttp.send(data);
    }
  },

  _build_url: function(options) {
    var url = options["protocol"]
    url += "//"
    url += options["host"]
    url += ":" + options["port"]
    url += options["path"]
    //console.log(url)
    return url;
  }
}

},{"undefined":undefined}],34:[function(require,module,exports){
module.exports = {
  base58: require(29),
  hmac: require(32),
  bigInt: require(30),
  extend: require(31),
  http: require(33),
  promise: require(35)
}

},{"29":29,"30":30,"31":31,"32":32,"33":33,"35":35}],35:[function(require,module,exports){
function promise() {
  this.sent = false
  this.error = false
  this.data = undefined
  this.meta = undefined
  this.callback = undefined

  this.send = function(error, data, meta) {
    this.error = error
    this.data = data
    this.sent = true

    if (meta) {
      this.meta = meta
    }

    if (typeof this.callback !== 'undefined') {
      this.callback(error, data, meta)
    }
  }

  this.then = function(new_callback) {
    this.callback = new_callback
    if (this.sent == true) {
      this.callback(this.error, this.data, this.meta);
    }
  }

  return this
}

module.exports = promise

},{}]},{},[27]);
