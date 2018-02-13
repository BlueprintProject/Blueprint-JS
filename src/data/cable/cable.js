var Listener = require('./listener');
var Record = require('../records/record');

var registry = {};
var callbackIdIndex = 0;

var getCableFromRegistry = function(endpoint, key) {
  return registry[endpoint + ":" + key];
}

var setCableInRegistry = function(endpoint, key, cable) {
  registry[endpoint + ":" + key] = cable;
}


var Cable = function(endpoint, model, key) {
  var cable = getCableFromRegistry(endpoint, key);

  if(typeof cable === 'undefined') {
    cable = this;
    setCableInRegistry(endpoint, key, cable);
    this.endpoint = endpoint;
    this.key = key;
    this._model = model;
  }

  return cable;
};

Cable.prototype._observers = {};
Cable.prototype._listeners = [];
Cable.prototype._model = Record;

Cable.prototype.on = function(key, callback) {
  var observers = this._observers[key];
  var callbackId = callbackIdIndex++;
  if(typeof observers === 'undefined') {
    observers = {};
  }

  observers[callbackId] = callback;

  this._observers[key] = observers;

  if(this._listeners.indexOf(key) === -1) {
    this._listeners.push(key);
    var endpointKey = [this.endpoint, this.key, key].join(":");
    Listener.addListener(endpointKey, this);
  }

  return key + ":" + callbackId;
}

Cable.prototype.removeWatcher = function(callbackId) {
  var callbackIdComponents = callbackId.split(":");

  var key = callbackIdComponents[0];
  var id = callbackIdComponents[1];

  var observers = this._observers[key];
  delete observers[id];

  if(Object.keys(observers).length === 0) {
    delete this._observers[key];
    var keyIndex = this._listeners.indexOf(key);
    if(keyIndex !== -1) {
      this._listeners.splice(keyIndex, 1);
      var endpointKey = [this.endpoint, this.key, key].join(":");
      Listener.removeListener(endpointKey)
    }
  }

}

Cable.prototype._handle = function(key, records) {
  var that = this;

  records = records.map(function(record) {
    return new that._model(record, true);
  });

  var result = records;

  if(records.length === 1) {
    result = records[0];
  }

  var action = key.split(":")[2]

  for(var i in this._observers[action]) {
    var observer = this._observers[action][i];
    observer(result);
  }
}

module.exports = Cable;
