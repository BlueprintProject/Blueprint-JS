// Workaround to make browserify not include this
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');


module.exports = function(options, data, callback) {

  // An object of options to indicate where to post to
  var post_options = {
    host: options["host"],
    port: options["port"],
    path: options["path"],
    method: options["method"],
    protocol: options["protocol"],
    headers: {
      'Content-Type': 'application/json'
    }
  };

  var a = http;

  if (options["protocol"] === "https:") {
    a = require("https")
  }

  // Set up the request
  var post_req = a.request(post_options, function(res) {
    res.setEncoding('utf8');
    var buffer = ""
    res.on('data', function(chunk) {
      buffer += chunk
    });

    res.on('end', function() {
      callback(buffer)
    })

    res.on('error', function() {
      callback()
    })

  });

  post_req.write(data);
  post_req.end();

}
