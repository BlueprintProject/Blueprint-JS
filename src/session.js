'use strict';

var currentSession;

var storageGet = function() {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('__api_session');
  } else {
    return currentSession;
  }
};

var storageSet = function(value) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('__api_session', value);
  } else {
    currentSession = value;
  }
};

var storageClear = function() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('__api_session');
  } else {
    currentSession = void 0;
  }
};

var getSession = function() {
  var sessionText = storageGet();
  var session;
  if (typeof sessionText !== 'undefined') {
    session = JSON.parse(sessionText);
  }
  if (session) {
    return session;
  } else {
    return {};
  }
};

var saveSession = function(session) {
  var sessionText = JSON.stringify(session);
  storageSet(sessionText);
};

module.exports = {
  get: function(key) {
    var session;
    session = getSession();
    return session[key];
  },
  set: function(key, value) {
    var session;
    session = getSession();
    session[key] = value;

    return saveSession(session);
  },
  clear: function() {
    return storageClear();
  }
};
