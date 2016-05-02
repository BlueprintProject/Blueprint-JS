var record = require("../records/record.js")

var utils = require("../../utils")
var adapter = require("../../adapter")

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
