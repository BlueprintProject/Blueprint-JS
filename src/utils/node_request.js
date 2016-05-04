
(function() {
  var fs, http, querystring;

  querystring = require('querystring');

  http = require('http');

  fs = require('fs');

  module.exports = function(options, data, callback) {
    var a, post_options, post_req;
    post_options = {
      host: options['host'],
      port: options['port'],
      path: options['path'],
      method: options['method'],
      protocol: options['protocol'],
      headers: {
        'Content-Type': 'application/json'
      }
    };
    a = http;
    if (options['protocol'] === 'https:') {
      a = require('https');
    }
    post_req = a.request(post_options, function(res) {
      var buffer;
      res.setEncoding('utf8');
      buffer = '';
      res.on('data', function(chunk) {
        return buffer += chunk;
      });
      res.on('end', function() {
        return callback(buffer);
      });
      return res.on('error', function() {
        return callback();
      });
    });
    post_req.write(data);
    return post_req.end();
  };

}).call(this);
