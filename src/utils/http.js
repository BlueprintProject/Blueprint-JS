'use strict';

module.exports = {
  send: function(options, callback, retryCount) {
    var xmlhttp;
    var url = this.buildUrl(options);
    var data = JSON.stringify(options.data);
    if (typeof retryCount === 'undefined') {
      retryCount = 0;
    }
    var that = this;
    var handled = false;
    function handleRetry() {
      if (retryCount >= 2 || options.method !== 'POST') {
        callback();
      } else {
        that.send(options, callback, retryCount + 1);
      }
    }
    function handle(data) {
      if (!handled) {
        handled = true;
        if (data === null || typeof data === 'undefined' || data === '') {
          handleRetry();
        } else {
          //try {
          var json = JSON.parse(data);
          if (json.error) {
            handleRetry();
          } else {
            callback(json);
          }
        //} catch (e) {
        //  handleRetry();
        //}
        }
      }
    }
    /* istanbul ignore else  */
    if (typeof window === 'undefined') {
      require('./node_request.js')(options, data, handle);
    } else {
      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        /* jshint ignore:start */
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
      /* jshint ignore:end */
      }
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
          handle(xmlhttp.responseText);
        }
      };
      xmlhttp.onerror = function() {
        handle();
      };
      xmlhttp.open(options.method, url);
      xmlhttp.setRequestHeader('Content-type', 'application/json');
      xmlhttp.send(data);
    }
  },

  buildUrl: function(options) {
    var url = options.protocol;
    url += '//';
    url += options.host;
    url += ':' + options.port;
    url += options.path;
    //console.log(url)
    return url;
  }
};
