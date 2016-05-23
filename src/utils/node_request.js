'use strict';

// Workaround to make browserify not include this
var http = require('http');

module.exports = function(options, data, callback) {
  // An object of options to indicate where to post to
  var postOptions = {
    host: options.host,
    port: options.port,
    path: options.path,
    method: options.method,
    protocol: options.protocol,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  var a = http;
  if (options.protocol === 'https:') {
    a = require('https');
  }
  // Set up the request
  var postReq = a.request(postOptions, function(res) {
    res.setEncoding('utf8');
    var buffer = '';
    res.on('data', function(chunk) {
      buffer += chunk;
    });
    res.on('end', function() {
      callback(buffer);
    });
    res.on('error', function() {
      callback();
    });
  });
  postReq.write(data);
  postReq.end();
};
