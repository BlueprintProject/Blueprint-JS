var utils = require("../../utils")
var adapter = require("../../adapter")

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
      var file = require("../files")
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
  var files = require("../files")

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
