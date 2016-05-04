
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
