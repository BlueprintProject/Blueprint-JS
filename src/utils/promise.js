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
      try {
        results.push(callbacks[i](response, this.meta));
      } catch(e) {
        console.log('Failure upon send', e);
      }
    }

    return results;
  };

  this.fail = function(newCallback) {
    this.errorCallbacks.push(newCallback);

    if (this.sent === true) {
      if (this.error) {
        try {
          newCallback(this.data, this.meta);
        } catch(e) {
          console.log('Failure upon send', e);
        }
      }
    }

    return this;
  };

  this.catch = this.fail;

  this.then = function(okCallback, failCallback) {

    this.successCallbacks.push(okCallback);

    if (failCallback) {
      this.errorCallbacks.push(failCallback);
    }

    if (this.sent === true) {
      if (this.data && !this.error) {
        try {
          var result = okCallback(this.data, this.meta);

          if(typeof result !== 'undefined') {
            this.data = result;
          }

        } catch(e) {
          console.log('Failure upon send', e);
        }
      } else if (failCallback) {
        try {
          failCallback(this.error, this.meta);
        } catch(e) {
          console.log('Failure upon send', e);
        }
      }
    }

    return this;
  };

  return this;
};

module.exports = promise;
