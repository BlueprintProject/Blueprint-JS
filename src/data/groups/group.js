adapter = require("../../adapter")
utils = require("../../utils")

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
