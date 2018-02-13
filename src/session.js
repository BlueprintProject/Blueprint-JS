'use strict';

var currentSession = {}

var AsyncStorage;

if (typeof global !== 'undefined' &&
    global.navigator &&
    global.navigator.product === 'ReactNative') {
    AsyncStorage = require('./utils/asyncstorage');
}

var loadSession = function(callback) {
  /* istanbul ignore else  */
  if (typeof global !== 'undefined' &&
      global.navigator &&
      global.navigator.product === 'ReactNative') {
      AsyncStorage.getItem('@BlueprintStore:APISession', function(error, value) {
        if(value) {
          currentSession = JSON.parse(value);
        }
        callback();
      });

  } else if (typeof window !== 'undefined') {
    var sessionText = window.localStorage.getItem('__api_session');
    if(sessionText) {
      currentSession = JSON.parse(sessionText);
    }

    callback();
  } else {
    callback();
  }
};

var saveSession = function() {
  var jsonValue = JSON.stringify(currentSession);

  if (typeof global !== 'undefined' &&
      global.navigator &&
      global.navigator.product === 'ReactNative') {
      AsyncStorage.setItem('@BlueprintStore:APISession', jsonValue);
  } else if (typeof window !== 'undefined') {
    window.localStorage.setItem('__api_session', jsonValue);
  }
};

var clearSession = function() {
  currentSession = {};

  if (typeof global !== 'undefined' &&
      global.navigator &&
      global.navigator.product === 'ReactNative') {

      AsyncStorage.removeItem('@BlueprintStore:APISession');
  } else if (typeof window !== 'undefined') {
    window.localStorage.removeItem('__api_session');
  }
};

module.exports = {
  load: function(callback) {
    loadSession(function(){
      if(callback) {
        callback();
      }
    });
  },
  get: function(key) {
    return currentSession[key];
  },
  set: function(key, value) {
    currentSession[key] = value;
    saveSession();
  },
  clear: function() {
    clearSession();
  }
};
