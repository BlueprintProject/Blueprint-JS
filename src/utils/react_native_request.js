'use strict';

module.exports = function(options, data, callback) {

  var url = options.protocol + '//' + options.host + ':' + options.port + '/' + options.path;
  var postOptions = {
    method: options.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  fetch(url, postOptions).then(function(response) {
    callback(response);
  }).done();

};
