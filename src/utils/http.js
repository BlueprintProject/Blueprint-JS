'use strict';

var reactRequest = function(options, data, callback) {

  var url = options.protocol + '//' + options.host + ':' + options.port + options.path;
  var postOptions = {
    method: options.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  };

  if(global.__DEV__) {
    //console.log("HTTP Request > ", url, JSON.parse(data), postOptions.method);
  }

  try {
    fetch(url, postOptions).then(function(response) {
      response.json().then(function(response){
        callback(response);
      });
    }).catch(function(){
      callback();
    }).done();
  } catch(e) {
    callback();
  }

};



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

      if (retryCount >= 10 || options.method !== 'POST' || (options.path.indexOf("/query") === -1 && options.path.indexOf("/users") !== 0)) {
        console.log("[RECOVERY] RECOVERY FAILED", retryCount, options, url);
        callback();
      } else if(retryCount > 5) {
        setTimeout(function(){
          console.log("[RECOVERY] Request Failed attempting recovery in ", Math.pow(3,retryCount), " ms", url);
          that.send(options, callback, retryCount + 1);
        }, Math.pow(3,retryCount));
      } else {
        console.log("[RECOVERY] Request Failed attempting recovery", url);
        that.send(options, callback, retryCount + 1);
      }
    }

    function handle(data) {
      if (!handled) {
        handled = true;

        if (data === null || typeof data === 'undefined' || data === '') {
          handleRetry();
        } else {
          try {

            if(typeof data === 'string') {
              data = JSON.parse(data);
            }

            if (data.error) {
              handleRetry();
            } else {
              callback(data);
            }
          } catch (e) {
            console.log("Failure upon handle callback", e);
            handleRetry();
          }
        }
      }
    }
    /* istanbul ignore else  */

    var isReact = typeof global !== 'undefined' &&
      global.navigator && global.navigator.product === 'ReactNative';

    var isNode = !isReact && typeof global !== 'undefined' && typeof global.navigator === 'undefined'

    if (isNode) {
      require('./node_request.js')(options, data, handle);
    } else {
      if(isReact) {
        xmlhttp = new XMLHttpRequest();
      } else if (window.XMLHttpRequest) {
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
    return url;
  }
};
