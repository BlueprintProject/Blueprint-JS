var adapter = require('../../adapter');

var listenerRegistery = {}
var listenerIteration = 0;

var refreshSocket = function() {
  cancelSocket();
  createSocket();
}

var cancelSocket = function() {
  listenerIteration++;
}

var handleSocketResponse = function(response) {
  for(var key in response.response) {
    var responseData = response.response[key];
    var cable = listenerRegistery[key];

    if(typeof cable !== 'undefined') {
      cable._handle(key, responseData);
    }
  }
};

var createSocket = function() {
  var keys = Object.keys(listenerRegistery);
  if(keys.length !== 0) {
    var request = {
      subscriptions: keys,
      timeout: 30,
    };

    var iteration = listenerIteration++;

    adapter.Api.post('subscriptions/poll', request, function(response) {
      if(iteration === listenerIteration-1) {
        setTimeout(function(){
          createSocket();
        });
      }

      handleSocketResponse(response);
    });
  }
}

var listener = {
  addListener: function(key, cable) {
    listenerRegistery[key] = cable;
    refreshSocket();
  },

  removeListener: function(key) {
    delete listenerRegistery[key];
  }
};

module.exports = listener;
