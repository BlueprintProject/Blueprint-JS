'use strict';

var promise;
promise = function() {
  this.sent = false;
  this.error = false;

  this.data = void 0;
  this.meta = void 0;

  this.successCallbacks = [];
  this.errorCallbacks = [];

  this.send = function(error, data, meta) {
    this.error = error;
    this.data = data;
    this.sent = true;
    if (meta) {
      this.meta = meta;
    }

    var callbacks = this.successCallbacks;
    var response = this.data;

    if (this.error) {
      callbacks = this.errorCallbacks;
      response = this.error;
    }

    var results = [];

    for (var i in callbacks) {
      results.push(callbacks[i](response, this.meta));
    }

    return results;
  };

  this.fail = function(newCallback) {
    this.errorCallbacks.push(newCallback);

    if (this.sent === true) {
      if (this.error) {
        newCallback(this.error, this.meta);
      }
    }

    return this;
  };
  this.then = function(newCallback) {

    this.successCallbacks.push(newCallback);

    if (this.sent === true) {
      if (this.data) {
        newCallback(this.data, this.meta);
      }
    }

    return this;
  };

  return this;
};

module.exports = promise;
