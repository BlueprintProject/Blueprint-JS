
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
