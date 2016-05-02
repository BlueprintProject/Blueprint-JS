var __session = undefined;

function storageGet() {
  if(typeof window !== "undefined") {
    return window.localStorage.getItem("__api_session")
  } else {
    return __session
  }
}

function storageSet(value) {
  if(typeof window !== "undefined") {
    window.localStorage.setItem("__api_session", value)
  } else {
    __session = value
  }
}

function storageClear() {
  if(typeof window !== "undefined") {
    window.localStorage.removeItem("__api_session")
  } else {
    __session = undefined
  }
}

function getSession() {
  var session_text = storageGet()
  var session = undefined
  if(typeof session_text !== "undefined") {
    session = JSON.parse(session_text)
  }

  if(session) {
    return session
  } else {
    return {}
  }
}

function saveSession(session) {
  var session_text = JSON.stringify(session)
  storageSet(session_text);
}

module.exports = {
  get: function(key) {
    var session = getSession()
    return session[key];
  },

  set: function(key, value) {
    var session = getSession()
    session[key] = value;
    saveSession(session);
  },

  clear: function() {
    storageClear()
  }
}
