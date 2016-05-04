
(function() {
  var __session, getSession, saveSession, storageClear, storageGet, storageSet;

  __session = void 0;

  storageGet = function() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('__api_session');
    } else {
      return __session;
    }
  };

  storageSet = function(value) {
    if (typeof window !== 'undefined') {
      return window.localStorage.setItem('__api_session', value);
    } else {
      return __session = value;
    }
  };

  storageClear = function() {
    if (typeof window !== 'undefined') {
      return window.localStorage.removeItem('__api_session');
    } else {
      return __session = void 0;
    }
  };

  getSession = function() {
    var session, session_text;
    session_text = storageGet();
    session = void 0;
    if (typeof session_text !== 'undefined') {
      session = JSON.parse(session_text);
    }
    if (session) {
      return session;
    } else {
      return {};
    }
  };

  saveSession = function(session) {
    var session_text;
    session_text = JSON.stringify(session);
    return storageSet(session_text);
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

}).call(this);
