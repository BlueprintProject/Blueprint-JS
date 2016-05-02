module.exports = {
  send: function(options, callback, retry_count) {
    var xmlhttp;

    var url = this._build_url(options)
    var data = JSON.stringify(options["data"])

    if(typeof retry_count === 'undefined') {
      retry_count = 0;
    }

    var that = this;
    var handled = false;

    function handleRetry() {
      if(retry_count >= 2 || options["method"] != "POST") {
        callback()
      } else {
        that.send(options, callback, retry_count + 1)
      }
    }

    function handle(data) {

      if(!handled) {
        handled = true;
        if(data == null || typeof data === 'undefined' || data == "") {
          handleRetry();
        } else {
          try {
            var json = JSON.parse(data)
            if(json["error"]) {
              handleRetry()
            } else {
              callback(json)
            }
          } catch (e) {
            handleRetry()
          }
        }
      }
    }

    /* istanbul ignore else  */
    if (typeof window === "undefined") {
      require("./node_request.js")(options, data, handle)
    } else {
      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
          handle(xmlhttp.responseText)
        }
      }

      xmlhttp.onerror = function() {
        handle()
      }

      xmlhttp.open(options["method"], url);
      xmlhttp.setRequestHeader("Content-type", "application/json");

      xmlhttp.send(data);
    }
  },

  _build_url: function(options) {
    var url = options["protocol"]
    url += "//"
    url += options["host"]
    url += ":" + options["port"]
    url += options["path"]
    //console.log(url)
    return url;
  }
}
