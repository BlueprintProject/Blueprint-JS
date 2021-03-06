(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env browser */
module.exports = typeof self == 'object' ? self.FormData : window.FormData;

},{}],2:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require(3);

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            seen.splice(seen.indexOf(node), 1);
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"3":3}],3:[function(require,module,exports){
exports.parse = require(4);
exports.stringify = require(5);

},{"4":4,"5":5}],4:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],5:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],6:[function(require,module,exports){
'use strict';

var Config = require(10);
var Utils = require(39);
var Auth = require(7);
var Session = require(32);

var bulkRequests = [];
var bulkRequestMasterTimer = void 0;
var bulkRequestIncrementalTimer = void 0;

var endsWith = function(string, suffix) {
  return string.indexOf(suffix, string.length - suffix.length) !== -1;
};

var bulkEnabled = true;

module.exports = {
  post: function(path, data, callback, prohibitBulk) {
    var options = this.buildOptions('POST', path, data);

    if (!prohibitBulk && bulkEnabled && endsWith(path, '/query')) {
      return this.sendRequestAllowBulk(options, data, callback);
    } else {
      return this.sendRequest(options, data, callback);
    }
  },

  put: function(path, data, callback) {
    var options = this.buildOptions('PUT', path, data);
    return this.sendRequest(options, data, callback);
  },

  defaultOptions: function() {
    return {
      host: Config.get('host'),
      port: Config.get('port'),
      protocol: Config.get('protocol') + ':',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  },

  buildOptions: function(method, path) {
    return Utils.extend({}, this.defaultOptions(), {
      method: method,
      path: '/' + Config.get('applicationId') + '/' + path
    });
  },

  sendRequest: function(options, data, callback) {
    var postData = {
      request: data
    };

    if (Session.get('auth_token')) {
      postData = Auth.generateRequest(postData, options.path, options.method);
    }

    options.data = postData;

    return Utils.http.send(options, function(data) {
      if (callback) {
        if (typeof data === 'undefined') {
          return callback({
            error: 1
          });
        } else {
          return callback(data);
        }
      }
    });
  },

  sendRequestAllowBulk: function(options, data, callback) {
    var that = this;

    if (typeof bulkRequestMasterTimer === 'undefined')
      bulkRequestMasterTimer = setTimeout(function() {
        bulkRequestMasterTimer = undefined;
        that.sendBulkRequest();
      }, 250);

    if (bulkRequestIncrementalTimer) {
      clearTimeout(bulkRequestIncrementalTimer);
      bulkRequestIncrementalTimer = undefined;
    }

    bulkRequestIncrementalTimer = setTimeout(function() {
      bulkRequestIncrementalTimer = undefined;
      that.sendBulkRequest.call(that);
    }, 50);

    bulkRequests.push({
      options: options,
      data: data,
      callback: callback
    });
  },

  sendBulkRequest: function() {
    var handlingBulkRequests = [];
    var guids = [];

    for (var i in bulkRequests) {
      var guid = Auth.generateGuid();
      handlingBulkRequests[i] = bulkRequests[i];

      guids.push(guid);
    }

    bulkRequests = [];

    if (bulkRequestMasterTimer) {
      clearTimeout(bulkRequestMasterTimer);
      bulkRequestMasterTimer = undefined;
    }

    if (bulkRequestIncrementalTimer) {
      clearTimeout(bulkRequestIncrementalTimer);
      bulkRequestIncrementalTimer = undefined;
    }

    var callbacks = {};
    if (handlingBulkRequests.length > 1) {
      var formattedRequests = [];
      for (var guidIndex in guids) {
        var requestGuid = guids[guidIndex];
        var request = handlingBulkRequests[guidIndex];
        formattedRequests.push({
          endpoint: request.options.path.split('/')[2],
          guid: requestGuid,
          request: request.data
        });

        callbacks[requestGuid] = request.callback;
      }

      var data = {
        requests: formattedRequests
      };

      var options = this.buildOptions('POST', 'bulk_query', data);

      this.sendRequest(options, data, function(data) {
        if (data && !data.error) {

          var existing;

          for (var guid in data.response) {
            var response = data.response[guid];
            var callback = callbacks[guid];
            var meta = {};
            callback({
              'error': false,
              'meta': meta,
              'response': response
            });

            existing = callback;
          }
        } else {
          for (var requestIndex in handlingBulkRequests) {
            var request = handlingBulkRequests[requestIndex];
            request.callback({
              error: 1
            });
          }
        }
      });
    } else if (handlingBulkRequests[0]) {
      var handlingRequest = handlingBulkRequests[0];
      this.sendRequest(handlingRequest.options, handlingRequest.data, handlingRequest.callback);
    }
  }
};

},{"10":10,"32":32,"39":39,"7":7}],7:[function(require,module,exports){
'use strict';

var Utils = require(39);
var Config = require(10);
var Session = require(32);

var currentUser = {};
var currentUserLoaded = false;

var setCurrentUser = function(user) {
  currentUser = user;
  currentUserLoaded = true;

  // jshint ignore: start

  if (currentUser['auth_token']) {
    Session.set('auth_token', currentUser.auth_token);
    Session.set('user_id', currentUser.id);
    Session.set('session_id', currentUser.session_id);
  }

// jshint ignore: end
};

var generateRequest = function(request, path, method) {
  request.authorization = {
    'user_id': Session.get('user_id'),
    'guid': this.generateGuid(),
    'timestamp': Math.floor(new Date().getTime() / 1000),
    'session_id': Session.get('session_id')
  };

  request.authorization.signature = this.signRequest(
    request,
    path,
    method,
    Session.get('auth_token')
  );


  return request;
};

var generateGuid = function() {
  var s4;
  s4 = function() {
    return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
  };
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

var signRequest = function(request, path, method, authToken) {
  var string;
  string = request.authorization.timestamp.toString();
  string += request.authorization.guid;
  string += path;
  string += method;
  request.request = this.sortHash(request.request);

  var stringify = require(2);

  string += stringify(request.request);

  //console.log("[SIGNATURE]", string, request, path, method);

  return this.signString(string, authToken);
};

var sortHash = function(hash) {
  //console.log("Sort", hash);
  if(Object.prototype.toString.call(hash) === '[object Array]' ) {
    var that = this;

    return hash.map(function(object) {
      return that.sortHash(object);
    });
  } else {
    var keys = [];
    var newHash = {};
    for (var hashKey in hash) {
      if (hash.hasOwnProperty(hashKey)) {
        keys.push(hashKey);
      }
    }
    keys.sort();
    for (var i in keys) {
      var key = keys[i];
      var value = hash[key];
      var isHash = typeof value === 'object' && value.length === void 0;
      var isArray = Object.prototype.toString.call(hash) === '[object Array]';
      if (isHash || isArray) {
        value = this.sortHash(value);
      }
      newHash[key] = value;
    }

    //console.log("Sorted", newHash);

    return newHash;
  }
};

var signString = function(string, token) {
  var hash = Utils.hmac(string, token);
  var bigInt = Utils.bigInt.str2bigInt(hash, 16);
  return Utils.base58.encodeBigInt(bigInt);
};

var Authenticate = function(data) {
  Session.clear();

  var request = {
    user: {
      email: data.email,
      password: data.password
    }
  };

  if (data.facebookId) {
    request = {
      user: {
        'facebook_id': data.facebookId,
        'facebook_token': data.facebookToken
      }
    };
  }

  var promise = new Utils.promise();
  var Api = require(6);
  Api.post('users/authenticate', request, function(response) {
    if (response === false || response.error) {
      return promise.send(true);

    } else {
      setCurrentUser(response.response.users[0]);
      return promise.send(false, currentUser);
    }
  });
  return promise;
};

var logout = function() {
  currentUser = undefined;
  currentUserLoaded = false;
  return Session.clear();
};

var RestoreSession = function(callback) {
  if(callback) {
    Session.load(function() {
      if (Session.get('auth_token')) {
        callback(Session.get('user_id'));
      } else {
        callback(false);
      }
    });
  } else {
    if (Session.get('auth_token')) {
      return Session.get('user_id');
    } else {
      return false;
    }
  }
};

var CurrentUser = function(callback) {
  if (typeof callback !== 'undefined') {
    var that = this;
    if (currentUserLoaded === false) {
      if (typeof Session.get('user_id') === 'undefined') {
        callback(false);
      } else {
        var path = 'users/' + Session.get('user_id');
        var Api = require(6);
        Api.post(path, {}, function(response) {

          try {
            if(typeof response !== 'undefined' &&
               typeof response.response !== 'undefined' &&
              response.response.users.length > 0) {
                 var data = response.response.users[0];
                 that.setCurrentUser(data);
                 callback(data);
            } else {
              logout();
              callback(false);
            }
          } catch(e) {
            logout();
            callback(false);
          }

        });
      }
    } else {
      callback(currentUser);
    }
  } else {
    return currentUser;
  }
};

var generateSignedURLForFile = function(properties) {
  var url = '/' + Config.get('applicationId');
  url += '/' + properties.recordEndpoint;
  url += '/' + properties.recordId;
  url += '/files';
  url += '/' + properties.fileId;
  if (Session.get('auth_token')) {
    var timestamp = Math.floor(new Date().getTime() / 1000 / (24 * 60 * 60));
    var sessionId = Session.get('session_id');
    var authToken = Session.get('auth_token');
    var signature = this.signString(timestamp + properties.fileId, authToken);
    url += '?timestamp=' + timestamp;
    url += '&session_id=' + sessionId;
    url += '&signature=' + signature;
  }
  var host = Config.get('protocol') + '://' + Config.get('host');
  if (Config.get('port') !== 443 && Config.get('port') !== 80) {
    host += ':' + Config.get('port');
  }
  return host + url;
};

module.exports = {
  generateRequest: generateRequest,
  generateGuid: generateGuid,
  generateSignedURLForFile: generateSignedURLForFile,

  sortHash: sortHash,

  signString: signString,
  signRequest: signRequest,

  Authenticate: Authenticate,
  RestoreSession: RestoreSession,

  setCurrentUser: setCurrentUser,

  CurrentUser: CurrentUser,
  Logout: logout,
};

},{"10":10,"2":2,"32":32,"39":39,"6":6}],8:[function(require,module,exports){
'use strict';

module.exports = {
  Records: require(9),
  Auth: require(7),
  Api: require(6)
};

},{"6":6,"7":7,"9":9}],9:[function(require,module,exports){
'use strict';

var api = require(6);
module.exports = {
  write: function(modelName, data, callback) {
    return this.writeWithCustomPath(modelName, modelName, data, callback);
  },

  trigger: function(modelName, id, callback) {
    var responseCallback = function() {
      return callback({});
    };

    return api.put(modelName + '/' + id + '/trigger', {}, responseCallback);
  },

  writeWithCustomPath: function(path, modelName, data, callback) {
    var request = data;

    var responseCallback = function(response) {
      var data;

      if (response.error) {
        data = undefined;
      } else {
        data = response.response[modelName][0];
      }
      return callback(data);
    };

    if (data.id) {
      return api.put(path + '/' + data.id, request, responseCallback);
    } else {
      return api.post(path, request, responseCallback);
    }
  },

  destroy: function(modelName, id, callback) {
    return this.destroyWithCustomPath(modelName, modelName, id, callback);
  },

  destroyWithCustomPath: function(path, modelName, id, callback) {

    var responseCallback = function(response) {
      var data = {};

      if (!response.error) {
        data = true;
      }

      return callback(data);
    };

    return api.post(path + '/' + id + '/destroy', {}, responseCallback);
  },

  query: function(modelName, query, callback) {
    var request = {
      'where': query
    };

    var responseCallback = function(response) {
      var data;
      data = [];
      if (response.error) {
      } else {
        data = response.response[modelName];
      }
      return callback(data, response.meta);
    };

    return api.post(modelName + '/query', request, responseCallback);
  }
};

},{"6":6}],10:[function(require,module,exports){
'use strict';

var extend = require(36);

/**
 * Config
 * @module blueprint/config
 * @private
 */
var config = {};

/** The base configuration object */
var baseConfig = {
  host: 'localhost',
  protocol: 'http',
  port: 8080,
  applicationId: '000000000000000000000001'
};

// The configuration object
config.currentConfiguration = baseConfig;

/**
 * Config Init
 * Sets the base configuration
 * @param {Object} config
 * @alias Blueprint.Init
 * @static
 */
config.Init = function(newConfig) {
  config.currentConfiguration = extend(config.currentConfiguration, newConfig);
};

/**
 * Get an item from the configuration
 * @param {String} key
 */
config.get = function(key) {
  return config.currentConfiguration[key];
};

module.exports = config;

},{"36":36}],11:[function(require,module,exports){
var Listener = require(13);
var Record = require(24);

var registry = {};
var callbackIdIndex = 0;

var getCableFromRegistry = function(endpoint, key) {
  return registry[endpoint + ":" + key];
}

var setCableInRegistry = function(endpoint, key, cable) {
  registry[endpoint + ":" + key] = cable;
}


var Cable = function(endpoint, model, key) {
  var cable = getCableFromRegistry(endpoint, key);

  if(typeof cable === 'undefined') {
    cable = this;
    setCableInRegistry(endpoint, key, cable);
    this.endpoint = endpoint;
    this.key = key;
    this._model = model;
  }

  return cable;
};

Cable.prototype._observers = {};
Cable.prototype._listeners = [];
Cable.prototype._model = Record;

Cable.prototype.on = function(key, callback) {
  var observers = this._observers[key];
  var callbackId = callbackIdIndex++;
  if(typeof observers === 'undefined') {
    observers = {};
  }

  observers[callbackId] = callback;

  this._observers[key] = observers;

  if(this._listeners.indexOf(key) === -1) {
    this._listeners.push(key);
    var endpointKey = [this.endpoint, this.key, key].join(":");
    Listener.addListener(endpointKey, this);
  }

  return key + ":" + callbackId;
}

Cable.prototype.removeWatcher = function(callbackId) {
  var callbackIdComponents = callbackId.split(":");

  var key = callbackIdComponents[0];
  var id = callbackIdComponents[1];

  var observers = this._observers[key];
  delete observers[id];

  if(Object.keys(observers).length === 0) {
    delete this._observers[key];
    var keyIndex = this._listeners.indexOf(key);
    if(keyIndex !== -1) {
      this._listeners.splice(keyIndex, 1);
      var endpointKey = [this.endpoint, this.key, key].join(":");
      Listener.removeListener(endpointKey)
    }
  }

}

Cable.prototype._handle = function(key, records) {
  var that = this;

  records = records.map(function(record) {
    return new that._model(record, true);
  });

  var result = records;

  if(records.length === 1) {
    result = records[0];
  }

  var action = key.split(":")[2]

  for(var i in this._observers[action]) {
    var observer = this._observers[action][i];
    observer(result);
  }
}

module.exports = Cable;

},{"13":13,"24":24}],12:[function(require,module,exports){
module.exports = require(11);

},{"11":11}],13:[function(require,module,exports){
var adapter = require(8);

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

},{"8":8}],14:[function(require,module,exports){
(function (global){
'use strict';

var utils = require(39);
var adapter = require(8);

/**
 * Creates a file object to be uploaded to the server. <br>
 * <b>Should not be called directly instead use, record.createFile</b>
 * @name File
 * @class
 * @see Blueprint.Data.Record#createFile
 * @example
 * var file = record.createFile('file_name.txt', data)
 * file.save().then(function(){
 *   // Upload Success!
 * })
 * @returns File
 */
var File = function(obj, record, data) {
  var properties;

  if (typeof obj === 'string') {
    properties = {
      name: obj
    };
  } else {
    properties = obj;
  }

  this.isBlueprintObject = true;
  this.endpoint = record.endpoint;
  properties.record_id = record.get('id'); // jshint ignore: line
  if (data && properties.size === void 0) {
    properties.size = data.size ? data.size : data.length;
  }
  this.data = data;
  this.object = properties;
  this.record = record;

  this._shouldSave = false;
  this._onSave = [];

  return this;
};

/**
 * Get a key from the file
 * @function File#get
 * @param key {string} - The key you would like to retrieve
 */
File.prototype.get = function(key) {
  return this.object[key];
};

/**
 * Save the file and upload it to the server
 * @function File#save
 * @returns Promise
 */
File.prototype.save = function() {
  this.object.record_id = this.record.get('id'); // jshint ignore: line
  this.record.files[this.get('name')] = this;


  console.log(this);

  if(typeof this.object.record_id === 'undefined') {
    this._shouldSave = true;

    var promise = new utils.promise();
    this._onSave.push(promise);

    return promise;
  } else {
    var promise = this._upload();

    this._shouldSave = false;

    var that = this;

    promise.then(function(result) {
      for(var i in that._onSave) {
        that._onSave[i].send(false, result);
      }

      that._onSave = [];
    }).fail(function(error) {
      for(var i in that._onSave) {
        that._onSave[i].send(error);
      }

      that._onSave = [];
    });

    return promise;
  }
}

File.prototype._upload = function() {
  var promise = new utils.promise();
  var that = this;
  var path = this.endpoint + '/' + this.getRecordId() + '/files';

  this.record.files[this.get('name')] = this;
  //console.log(this, this.record, this.record, this.get('name'));

  adapter.Records.writeWithCustomPath(path, 'files', {
    file: this.object
  }, function(response) {

    if (typeof response !== void 0 && response && response.upload_request) { // jshint ignore:line
      that.object = response;

      if (that.data) {

          var req = response.upload_request; // jshint ignore:line

          var params = req.params;
          params.file = that.data;

          var formData;

          if (typeof global !== 'undefined') {
            var FormData = require(1);
            formData = new FormData();
          } else {
            formData = new FormData();
          }

          for (var key in params) {
            var value = params[key];
            formData.append(key, value);
          }

          if (typeof global !== 'undefined') {
            if(global.navigator &&
              global.navigator.product === 'ReactNative') {
                fetch(req.url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                  body: formData
                }).then(function() {
                  promise.send(false, that);
                }).catch(function(err) {
            		  promise.send(err);
                });
            }
          } else {
            var xmlhttp;

            if (window.XMLHttpRequest) {
              xmlhttp = new XMLHttpRequest();
            } else {
              xmlhttp = new ActiveXObject('Microsoft.XMLHTTP'); // jshint ignore:line
            }

            xmlhttp.onreadystatechange = function() {
              if (xmlhttp.readyState === 4) {
                return promise.send(false, that);
              }
            };

            xmlhttp.open('post', req.url);
            xmlhttp.send(formData);
          }
      } else {
        return promise.send(false, that);
      }
    } else {
      return promise.send(true);
    }
  });
  return promise;
};

/**
 * Deletes a file
 * @function File#destroy
 */
File.prototype.destroy = function() {
  var promise = new utils.promise();
  var path = this.endpoint + '/' + this.get('record_id') + '/files';

  adapter.Records.destroyWithCustomPath(path, 'files', this.get('id'), function(data) {
    if (typeof data !== void 0) {
      return promise.send(false);
    }
  });

  return promise;
};

/**
 * Gets the signed URL for a file
 * @function File#getURL
 */
File.prototype.getURL = function() {
  var presignedURL = this.get('presigned_url');
  var valid = this.get('presigned_expiration') > ((new Date()) / 1000);

  if(typeof this.data === 'object' && typeof this.data.uri !== 'undefined') {
    return this.data.uri;
  } else if (presignedURL && valid) {
    return this.get('presigned_url');
  } else {
    var file = {
      'file_id': this.get('id'),
      'record_id': this.get('record_id'),
      'record_endpoint': this.endpoint
    };

    return adapter.Auth.generateSignedURLForFile(file);
  }
};

File.prototype.getRecordId = function() {
  if (this.record) {
    return this.record.get('id');
  } else {
    return this.get('record_id');
  }
};

module.exports = File;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"1":1,"39":39,"8":8}],15:[function(require,module,exports){
'use strict';

var File = require(14);

module.exports.File = File;

},{"14":14}],16:[function(require,module,exports){
'use strict';

var Session = require(32);
var Config = require(10);
var Group = require(17);

module.exports.PrivateGroup = function() {
  return new Group({
    id: Session.get('user_id')
  });
};

module.exports.PublicGroup = function() {
  return new Group({
    id: Config.get('applicationId')
  });
};

module.exports.GroupWithId = function(id) {
  return new Group({
    id: id
  });
};

},{"10":10,"17":17,"32":32}],17:[function(require,module,exports){
'use strict';

var adapter = require(8);
var utils = require(39);

/**
 * Creates a file object to be uploaded to the server. <br>
 * @class Group
 * @param properties {object} - The content of the group object
 * @returns Group
 */
var Group = function(properties) {
  this.isBlueprintObject = true;
  this.object = properties;
  this.modifyUserMembership = function(userId, type, adding) {
    var action = void 0;
    var inverseAction = void 0;
    var key = void 0;
    var inverseKey = void 0;

    if (adding) {
      action = 'add';
      inverseAction = 'remove';
    } else {
      action = 'remove';
      inverseAction = 'add';
    }

    key = action + '_' + type + '_ids';
    inverseKey = inverseAction + '_' + type + '_ids';

    if (typeof this.object[key] === 'undefined') {
      this.object[key] = [];
    }

    if (this.object[key].indexOf(userId) === -1) {
      this.object[key].push(userId);
    }

    if (typeof this.object[inverseKey] === 'object') {
      var index = this.object[inverseKey].indexOf(userId);
      if (index !== -1) {
        return this.object[inverseKey].splice(index, 1);
      }
    }
  };

  return this;
};

/**
 * Get a value in the object's content
 * @function Group#get
 * @param key {string} - The key you would like to get
 * @returns Object
 */

Group.prototype.get = function(key) {
  return this.object[key];
};

/**
 * Set a value in the object's content
 * @function Group#set
 * @param key {string} - The key you would like to get
 * @param value {object} - The value you would like to set
 */
Group.prototype.set = function(key, value) {
  this.object[key] = value;
};


/**
 * Add a user to a group
 * @function Group#addUser
 * @param user {Blueprint.User} - The user you would like to add
 */
Group.prototype.addUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'user', true);
};

/**
 * Remove a user to a group
 * @function Group#removeUser
 * @param user {Blueprint.User} - The user you would like to remove
 */
Group.prototype.removeUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'user', false);
};

/**
 * Add user to a group as super user
 * @function Group#addSuperUser
 * @param user {Blueprint.User} - The user you would like to add
 */
Group.prototype.addSuperUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'super_user', true);
};

/**
 * Remove user from group as super user
 * @function Group#removeSuperUser
 * @param user {Blueprint.User} - The user you would like to remove
 */
Group.prototype.removeSuperUser = function(user) {
  this.modifyUserMembership(user.get('id'), 'super_user', false);
};

/**
 * Add a user id to a group
 * @function Group#addUserWithId
 * @param user {string} - The user id you would like to add
 */
Group.prototype.addUserWithId = function(user) {
  this.modifyUserMembership(user, 'user', true);
};

/**
 * Remove a user id to a group
 * @function Group#removeUserWithId
 * @param user {string} - The user id you would like to remove
 */
Group.prototype.removeUserWithId = function(user) {
  this.modifyUserMembership(user, 'user', false);
};

/**
 * Add user with id as super user
 * @function Group#addSuperUserWithId
 * @param user {string} - The user id you would like to add
 */
Group.prototype.addSuperUserWithId = function(user) {
  this.modifyUserMembership(user, 'super_user', true);
};

/**
 * Remove user with id from super users
 * @function Group#removeSuperUserWithId
 * @param user {string} - The user id you would like to remove
 */
Group.prototype.removeSuperUserWithId = function(user) {
  this.modifyUserMembership(user, 'super_user', false);
};

/**
 * Join a group
 * @function Group#join
 * @param request {object} - The join request
 */
Group.prototype.join = function(request) {
  var promise = new utils.promise();
  var that = this;

  var callback = function(data) {
    that.object = data;
    return promise.send(false, that);
  };

  adapter.Api.post('groups/' + this.get('id') + '/join', {
    group: request
  }, function(response) {
    var data = [];

    if (!response.error) {
      data = response.response.groups[0];
    }

    return callback(data);
  });

  return promise;
};

/**
 * Leave a group
 * @function Group#leave
 */

Group.prototype.leave = function() {
  var promise = new utils.promise();
  var that = this;
  var callback = function(data) {
    that.object = data;
    return promise.send(false, that);
  };

  adapter.Api.post('groups/' + this.get('id') + '/leave', {}, function(response) {
    var data;
    data = [];
    if (response.error) {
    } else {
      data = response.response.groups[0];
    }
    return callback(data);
  });

  return promise;
};

/**
 * Save a group
 * @function Group#save
 * @returns Promise
 */

Group.prototype.save = function() {
  var promise = new utils.promise();
  var that = this;

  var serverObject = {
    group: this.object
  };

  if (this.object && this.object.id) {
    serverObject.id = this.object.id;
  }

  adapter.Records.write('groups', serverObject, function(data) {
    if (typeof data !== void 0) {
      that.object = data;
      return promise.send(false, that);
    }
  });

  return promise;
};

/**
 * Destroy a group
 * @function Group#destroy
 * @returns Promise
 */

Group.prototype.destroy = function() {
  var promise = new utils.promise();

  adapter.Api.post('groups/' + this.get('id') + '/destroy', {}, function(data) {
    if (typeof data !== void 0) {
      return promise.send(false);
    }
  });

  return promise;
};

module.exports = Group;

},{"39":39,"8":8}],18:[function(require,module,exports){
'use strict';

var Find = require(16);
var Group = require(17);

module.exports.Group = Group;
module.exports.PublicGroup = Find.PublicGroup;
module.exports.PrivateGroup = Find.PrivateGroup;
module.exports.GroupWithId = Find.GroupWithId;

},{"16":16,"17":17}],19:[function(require,module,exports){
'use strict';

var Records = require(23);
var Groups = require(18);
var Users = require(29);
var Models = require(20);

/**
 * Used for Interacting With Data
 * @module blueprint/data
 * @private
 */
var Data = {};

Data.Records = {};
Data.Records.Record = Records.Record;
Data.Records.Find = Records.find.Find;
Data.Records.FindOne = Records.find.FindOne;

Data.Groups = {};
Data.Groups.CreateGroup = Groups.CreateGroup;
Data.Groups.PrivateGroup = Groups.PrivateGroup;
Data.Groups.PublicGroup = Groups.PublicGroup;
Data.Groups.GroupWithId = Groups.GroupWithId;
Data.Groups.Group = Groups.Group;

Data.Users = {};

// Existing Sessions
Data.Users.GetCurrentUser = Users.GetCurrentUser;
Data.Users.Logout = Users.Logout;

// Creating Users
Data.Users.Register = Users.Register;

// Creating Sessions
Data.Users.Authenticate = Users.Authenticate;
Data.Users.RestoreSession = Users.RestoreSession;

Data.Models = {};
Data.Models.Model = Models;

module.exports = Data;

},{"18":18,"20":20,"23":23,"29":29}],20:[function(require,module,exports){
'use strict';

module.exports = require(21);
//module.exports.Class = require('./class');

},{"21":21}],21:[function(require,module,exports){
'use strict';

var utils = require(39);
var Cable = require(12);
var Listener = require(13);

var modelRegistry = {};


/**
 * Creates a new record without a model
 * @name Blueprint.Model
 * @class
 * @example
 * var dog = new Blueprint.Model('pets', function(){
 *   // Custom Model Methods
 * });
 * @returns Blueprint.Model
 */

var Model = function(name, arg1, arg2) {
  var instanceCode = false;
  var modelStructure = false;

  var recordRegistry = {};

  if(typeof arg1 === 'function') {
   instanceCode = arg1;
  } else if(typeof arg1 === 'object') {
   modelStructure = arg1;
  }

  if(typeof arg2 === 'function') {
   instanceCode = arg2;
  }

  var utils = require(39);

  var inject = function(obj) {
   if(instanceCode === false) {
     return obj;
   } else {
     return instanceCode.call(obj);
   }
  };

  var constructor = function(baseData, preNested) {
    var Record = require(24);

    var recordObject;

    if(typeof baseData !== 'undefined' && baseData.isBlueprintObject) {
      recordObject = baseData;
    } else {
      if (preNested) {
        recordObject = new Record(name, baseData, true);
      } else {
        recordObject = new Record(name, {});

        if (baseData) {
          recordObject.update(baseData);
        }
      }
    }

    if(typeof recordObject.get('id') !== 'undefined') {
      var registryObject = recordRegistry[recordObject.get('id')];

      if(typeof registryObject !== 'undefined') {
        registryObject.update(recordObject);
        return registryObject;
      }

      recordRegistry[recordObject.get('id')] = this;
    }

    this._record = recordObject;

    this.isBlueprintObject = true;
    this.isLoaded = true;

    var createProxy = function(key) {
      return function() {
        return this._record[key].apply(this._record, arguments);
      };
    }

    for(var _key in this._record) {
      var key = _key.toString();

      if(typeof this[key] === 'undefined' && typeof this._record[key] === 'function') {
        this[key] = createProxy(key);
      }
    }

    this._keyMap = {};
    this._associationMap = {};

    if(modelStructure !== false) {
      createStructure.call(this, modelStructure);
    }
  };

  inject(constructor);

  /**
   * Query the database for records without a model
   * @param {string} model - The name of the endpoint the record belongs to
   * @param {object} query - The query
   * @function Blueprint.Model.Find
   * @returns Promise
   */

  constructor.find = function(where) {
    var that = this;

    var promise = new utils.promise();
    require(22).Find(name, where).then(function(results) {
      results = results.map(function(result){
        return new that(result);
      });

      if(results.length > 0 && Object.keys(results[0]._associationMap).length > 0) {
        that.bulkLoadAssociations(results).then(function(){
          promise.send(void 0, results);
        }).catch(function(e) {
          console.error(e);
        });
      } else {
        promise.send(void 0, results);
      }
    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  /**
   * Query the database for a single record without a model
   * @param {string} model - The name of the endpoint the record belongs to
   * @param {object} query - The query
   * @function Blueprint.Model.FindOne
   * @returns Promise
   */

  constructor.findOne = function(where) {
    var promise = new utils.promise();
    var that = this;
    require(22).FindOne(name, where).then(function(result) {
      result = new that(result);

      if(Object.keys(result._associationMap).length > 0) {
        that.bulkLoadAssociations([result]).then(function(){
          promise.send(void 0, result);
        }).catch(function(e) {
          console.error(e);
        });
      } else {
        promise.send(void 0, result);
      }

    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  var buildAssociationFunction = function(key, association) {
    var that = this;

    var getter;

    getter = function(options) {
      var loaded = that["_" + key + "_loaded"];

      if(typeof options === 'undefined') {
        options = {};
      }

      var value = that["_" + key];

      if(!loaded || options.refresh === true) {
        var promise = that.loadAssociation(association);
        promise.refresh = function() {
          return promise;
        };

        return promise;
      }

      var promise = new utils.promise();
      promise.send(false, value);

      promise.refresh = function() {
        return getter({refresh: true});
      }

      return promise;
    }

    return getter;
  }

  var createStructure = function(structure) {
    for(var key in structure) {
      var item = structure[key];

      if(typeof item === 'function') {
        item = {type: item};
      }

      if(typeof item.association !== 'undefined') {
        item.association.key = key;
        this._associationMap[key] = item.association;
        this[key] = buildAssociationFunction.call(this, key, item.association);
      } else if(typeof this[key] === 'undefined') {
        // Add the key to the key map
        var blueprintKey = [key];
        if(item.key) {
          blueprintKey = [item.key];
        } else if(item.protected) {
          blueprintKey = ['protected'].concat(key);
        }

        blueprintKey = blueprintKey.join('.');

        item.key = blueprintKey;
        this._keyMap[key] = item;

        // Map the value
        ensureKey.call(this, key, true);

      } else {
        throw 'Key cannot be `'+key+'`, it is an internal blueprint name';
      }
    }
  };

  var ensureKey = function(key, update) {
    var item = this._keyMap[key];

    if(typeof item === 'object') {
      var value;

      if(update || typeof this[key] === 'undefined') {
        value = this._record.get(item.key);
      } else {
        value = this[key];
      }

      if(typeof value === 'undefined') {
        value = item.default;
      }

      var typeOkay = true;
      var expectedType = false;

      switch (item.type) {
        case String:
          expectedType = 'string';
          break;
        case Number:
          expectedType = 'number';
          break;
        case Object:
          expectedType = 'object';
          break;
        case Boolean:
          expectedType = 'boolean';
          break;
      }

      if(expectedType && typeof value !== 'undefined') {
        typeOkay = typeof value === expectedType;
      }

      if(typeOkay) {
        this[key] = value;
        this._record.set(item.key, value);
      } else {
        console.error('Type for `'+key+'` is `'+typeof value+'` (`'+value+'`) not `'+expectedType+'`');
      }
    }
  }

  constructor.prototype.set = function(key, value) {
    var result = this._record.set(key, value);

    for(var i in this._keyMap) {
      var item = this._keyMap[i];
      if(item.key === key) {
        ensureKey.call(this, key, true);
        break;
      }
    }

    return result;
  };

  constructor.prototype.get = function(key) {
    for(var i in this._keyMap) {
      var item = this._keyMap[i];
      if(item.key === key) {
        ensureKey.call(this, key);
        break;
      }
    }

    return this._record.get(key);
  };

  constructor.prototype.update = function(object) {
    var result;
    result = this._record.update(object);
    this.sync();
    return result;
  }

  constructor.prototype.save = function() {
    this.sync();
    return this._record.save();
  }

  constructor.prototype.sync = function() {
    for(var key in this._keyMap) {
      ensureKey.call(this, key);
    }
  }

  constructor.prototype.revert = function() {
    for(var key in this._keyMap) {
      ensureKey.call(this, key, true);
    }
  }

  constructor.prototype.associationQueries = function(force) {
    var queries = {};
    for(var key in this._associationMap) {
      var association = this._associationMap[key];
      var endpoint = association.endpoint;

      var query = {
        query: association.scope(this),
        multi: association.multi,
        key: key,
      }

      var loaded = this['_' + key + '_loaded'] === true;

      if((!loaded && association.autoload) || force) {
        if(typeof queries[endpoint] === 'undefined') {
          queries[endpoint] = [];
        }

        queries[endpoint].push(query);

        this['_' + key + '_loaded'] = false;
        this['_' + key] = association.multi ? [] : undefined;
      }
    }

    return queries;
  }

  constructor.prototype.loadAssociation = function(association) {
    var promise = new utils.promise();
    var associationQueries = this.associationQueries(true);
    var endpoint = association.endpoint;
    var key = association.key;

    var associationQuery;

    for(var i in associationQueries[endpoint]) {
      var query = associationQueries[endpoint][i];
      if(query.key === key) {
        associationQuery = query;
        break;
      }
    }

    var model = modelRegistry[endpoint];

    if(typeof model === 'undefined') {
      model = new Model(endpoint);
    }

    var that = this;

    model.find(associationQuery.query).then(function(result){

      if(association.multi) {
        that['_' + association.key] = result;
      } else {
        that['_' + association.key] = result[0];
      }

      that['_' + association.key + '_loaded'] = true;

      promise.send(false, that['_' + association.key]);
    }).catch(function(e) {
      promise.send(e);
    });

    return promise;
  };

  constructor.prototype.flatten = function(rootKey) {
    var promise = new utils.promise();

    var structure = this.constructor.flatStructure(rootKey);

    var toLoad = 0;
    var loaded = 0;

    var incrementCounter = function() {
      loaded++;

      if(loaded===toLoad) {
        promise.send(false, structure);
      }
    };

    var buildAssociationPromise = function(key) {
      toLoad++;

      return function(result) {
        structure[key] = result;
        incrementCounter();
      };
    };

    for(var key in modelStructure) {
      var item = modelStructure[key];
      if(typeof item.association === 'undefined') {
        structure[rootKey][key] = this[key];
        structure[rootKey].record = this;
      } else {
        this[key]()
        .then(buildAssociationPromise(key))
        .catch(incrementCounter);
      }
    }

    if(loaded===toLoad) {
      promise.send(false, structure);
    }

    return promise;
  };

  constructor.bulkLoadAssociations = function(records, force) {
    var endpointQueries = {};
    var promise = new utils.promise();
    var needToLoad = 0;
    var loaded = 0;

    var associations = records.map(function(record) {
      var queries = record.associationQueries(force);
      for(var endpoint in queries) {
        var query = queries[endpoint];
        if(typeof endpointQueries[endpoint] === 'undefined') {
          endpointQueries[endpoint] = [];
        }

        endpointQueries[endpoint] = endpointQueries[endpoint].concat(query);
      }


      return {
        record: record,
        queries: queries,
      };
    });

    if(Object.keys(endpointQueries).length === 0) {
      promise.send(false, true);
      return promise;
    }

    var compiledEndpointQueries = {};

    for(var endpoint in endpointQueries) {
      compiledEndpointQueries[endpoint] = {};

      var queries = endpointQueries[endpoint];
      for(var i in queries) {
        var query = queries[i];

        var keys = Object.keys(query.query).join(",");
        var values = Object.values(query.query);

        if(typeof compiledEndpointQueries[endpoint] === 'undefined') {
          compiledEndpointQueries[endpoint] = {};
        }

        if(typeof compiledEndpointQueries[endpoint][keys] === 'undefined') {
          compiledEndpointQueries[endpoint][keys] = [];
        }

        compiledEndpointQueries[endpoint][keys].push(values);
      }
    }

    var finalizedQueries = {};

    for(var endpoint in compiledEndpointQueries) {
      var compiledEndpointQueryKeys = compiledEndpointQueries[endpoint];
      var endpointQueries = [];

      for(var keys in compiledEndpointQueryKeys) {
        keys = keys.split(",");
        var query = {};

        for(var i in keys) {
          var key = keys[i];
          query[key] = {"$in": []};
        }

        var values = compiledEndpointQueryKeys[keys];
        for(var valueIndex in values) {
          var valueSet = values[valueIndex];
          for(var valueSetIndex in valueSet) {
            var value = valueSet[valueSetIndex];
            var key = keys[valueSetIndex];

            if(query[key]["$in"].indexOf(value) === -1) {
              query[key]["$in"].push(value);
            }
          }
        }

        for(var key in query) {
          var value = query[key];
          if(value["$in"].length === 1) {
            query[key] = value["$in"][0];
          }
        }

        endpointQueries.push(query);
      }

      if(endpointQueries.length === 1) {
        finalizedQueries[endpoint] = endpointQueries[i];
      } else {
        finalizedQueries[endpoint] = {"$or": endpointQueries};
      }
    }

    var associateRecords = function(records, endpoint) {
      for(var i in associations) {
        var associationRecord = associations[i];
        var masterRecord = associationRecord.record;
        var endpointQueries = associationRecord.queries[endpoint];

        if(typeof endpointQueries === 'object' && endpointQueries.length > 0) {
          for(var i in endpointQueries) {
            var queryRecord = endpointQueries[i];
            var query = queryRecord.query;

            for(var i in records) {
              var childRecord = records[i];
              var okay = true;

              for(var key in query) {
                var value = query[key];
                okay = value === childRecord.get(key);
                if(!okay) {
                  break;
                }
              }

              if(okay) {
                if(queryRecord.multi) {
                  masterRecord["_" + queryRecord.key].push(childRecord);
                } else {
                  masterRecord["_" + queryRecord.key] = childRecord;
                }
              }
            }
          }

          masterRecord["_" + queryRecord.key + "_loaded"] = true;
        }
      }
    }

    for(var endpoint in finalizedQueries) {
      var model = modelRegistry[endpoint];
      if(typeof model === 'undefined') {
        model = new Model(endpoint);
      }

      var query = finalizedQueries[endpoint];
      var that = this;

      needToLoad++;

      model.find(query).then(function(records) {
        if(records.length > 0) {
          associateRecords.call(that, records, records[0]._record.endpoint);
        }

        loaded++;
        if(loaded === needToLoad) {
          promise.send(false, true);
        }
      }).catch(function(e) {
        loaded++;
        console.error(e, query, endpoint, that, '!!!')
      });
    }

    return promise;
  };

  modelRegistry[name] = constructor;

  constructor.register = function() {
    modelRegistry[name] = this;
  };

  constructor.flatStructure = function(rootName) {
    var structure = {};
    structure[rootName] = {};

    if(modelStructure !== false) {
      for(var key in modelStructure) {
        var association = modelStructure[key].association;
        if(typeof association !== 'undefined') {
          structure[key] = association.multi ? [] : {};
        }
      }
    }

    return structure;
  };

  constructor.prototype.on = function(key, callback) {
    var cable = new Cable(name, this.constructor, this.get('id'));
    return cable.on(key, callback);
  }

  constructor.watch = function(key) {
    var cable = new Cable(name, this, key);

    return cable;
  };

  return constructor;
};

module.exports = Model;

},{"12":12,"13":13,"22":22,"24":24,"39":39}],22:[function(require,module,exports){
'use strict';
var Record = require(24);
var Utils = require(39);
var Adapter = require(8);

/**
 * Query the database for records without a model
 * @param {string} model - The name of the endpoint the record belongs to
 * @param {object} query - The query
 * @function Blueprint.Data.Find
 * @example
 * Blueprint.Data.Find("pets", {"species": "Dog"}).then(function(pets){
 *   // Handle Pet Objects
 * }).fail(function(error){
 *   // Handle Failure
 * })
 * @returns Promise
 */

var Find = function(model, query) {
  var promise = new Utils.promise();
  Adapter.Records.query(model, query, function(data, meta) {
    //console.log(data, meta, "<<<");

    var objects = [];
    if (data) {
      var i = 0;
      while (i < data.length) {
        var object = data[i];
        object = new Record(model, object, true);
        objects.push(object);
        i++;
      }
    }

    //console.log(objects);

    promise.send(false, objects, meta);
  });
  return promise;
};


/**
 * Query the database for a single record without a model
 * @param {string} model - The name of the endpoint the record belongs to
 * @param {object} query - The query
 * @function Blueprint.Data.Find
 * @example
 * Blueprint.Data.FindOne("pets", {"name": "Wiley"}).then(function(pet){
 *   // Handle Pet Object
 * }).fail(function(error){
 *   // Handle Failure
 * })
 * @returns Promise
 */

var FindOne = function(model, query) {
  var promise = new Utils.promise();
  query.$limit = 1;
  Adapter.Records.query(model, query, function(data, meta) {
    var object = null;
    if (typeof data !== 'undefined' &&
      data !== null &&
      typeof data[0] !== 'undefined' &&
      typeof data[0].content !== 'undefined') {

      object = new Record(model, data[0], true);
      promise.send(false, object, meta);
    } else {
      promise.send(true);
    }
  });
  return promise;
};

module.exports.Find = Find;
module.exports.FindOne = FindOne;

},{"24":24,"39":39,"8":8}],23:[function(require,module,exports){
'use strict';

var records = {};

records.find = require(22);
records.Record = require(24);

module.exports = records;

},{"22":22,"24":24}],24:[function(require,module,exports){
'use strict';

var Utils = require(39);
var Adapter = require(8);
var Session = require(32);

/**
 * Creates a new record without a model
 * @name Blueprint.Data.Record
 * @class
 * @example
 * var dog = new Blueprint.Data.Record('pets', {
 *   species: 'dog',
 *   name: 'wiley'
 * });
 * @returns Blueprint.Model
 */

var Record = function(endpoint, object, preNested) {
  this.isBlueprintObject = true;
  this.noContentRoot = false;
  this.endpoint = endpoint;
  this.isLoaded = true;

  if (preNested) {
    if (typeof object !== 'undefined') {
      this.object = object;
    } else {
      this.object = {};
    }

    if(typeof this.object.content === 'undefined') {
      this.object.content = {};
    }

    this._serverObjectContent = JSON.stringify(object.content);
  } else {
    this.object = {};
    this._serverObjectContent = JSON.stringify(object);
    this.object.content = object;
  }

  this.files = {};

  if (typeof this.object.permissions === 'undefined') {
    this.object.permissions = {};
  }

  var keys = [
    'read',
    'write',
    'destroy'
  ];

  for (var index in keys) {
    if (!isNaN(parseInt(index))) {
      var key = keys[index] + '_group_ids';
      if (typeof this.object.permissions[key] === 'undefined') {
        this.object.permissions[key] = [];
      }
    }
  }

  if (typeof this.object.files !== 'undefined') {
    for (var i in this.object.files) {
      var f = this.object.files[i];
      var File = require(14);
      this.files[f.name] = new File(f, this);
    }
  }

  if(typeof this.object.created_by === 'undefined') {
    this.object.created_by = Session.get('user_id');
  }

  if(typeof this.object.created_at === 'undefined') {
    this.object.created_at = new Date() / 1000;
    this.object.updated_at = new Date() / 1000;
  }

  return this;
};


/**
 * Set a value in the object's content
 * @function Blueprint.Data.Record#set
 * @param key {string} - The key you would like to set
 * @param value {object} - The value you would like to set
 */
Record.prototype.set = function(key, value) {
  var keys = key.split(".")

  if(keys.length > 1) {
    var item = this.object.content;



    for(var i=0; i < keys.length; i++) {
      var key = keys[i];

      if(i === keys.length - 1) {
        item[key] = value;
      } else if(typeof item[key] === 'undefined') {
        item = item[key] = {};
      } else {
        item = item[key];
      }
    }

    return value;
  } else {
    this.object.content[key] = value;
  }
};

/**
 * Get a value in the object's content
 * @function Blueprint.Data.Record#get
 * @param key {string} - The key you would like to get
 * @returns Object
 */
Record.prototype.get = function(key) {
  var keys = key.split(".")

  if(keys.length > 1) {
    var value = this.object.content;

    for(var i = 0; i < keys.length; i++) {
      if(typeof value === 'undefined' || typeof value[key] === 'undefined') {
        value = undefined;
        break;
      } else {
        var key = keys[i];
        value = value[key]
      }
    }

    return value;
  } else if (key === 'id') {
    return this.object[key];
  } else {
    var value = this.object.content[key];
    if (!value) {
      value = this.object[key];
    }
    return value;
  }
};

/*
 * Permissions
 */

Record.prototype.addGroup = function(type, group) {
  var groupId = group.get('id');
  var key = type + '_group_ids';
  this.object.permissions[key].push(groupId);
};

Record.prototype.removeGroup = function(type, group) {
  var groupId = group.get('id');
  var key = type + '_group_ids';
  if (typeof this.object.permissions === 'object') {
    if (typeof this.object.permissions[key] === 'object') {
      var index = this.object.permissions[key].indexOf(groupId);
      if (index !== -1) {
        return this.object.permissions[key].splice(index, 1);
      }
    }
  }
};

/**
 * Authorize a group to read this record
 * @function Blueprint.Data.Record#addReadGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addReadGroup = function(group) {
  return this.addGroup('read', group);
};

/**
 * Authorize a group to write to this record
 * @function Blueprint.Data.Record#addWriteGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addWriteGroup = function(group) {
  return this.addGroup('write', group);
};

/**
 * Authorize a group to destroy this record
 * @function Blueprint.Data.Record#addDestroyGroup
 * @param group {Blueprint.Group} - The group you would like to add
 */
Record.prototype.addDestroyGroup = function(group) {
  return this.addGroup('destroy', group);
};

/**
 * Deauthorize a group from reading this record
 * @function Blueprint.Data.Record#removeReadGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeReadGroup = function(group) {
  return this.removeGroup('read', group);
};

/**
 * Deauthorize a group from writing to this record
 * @function Blueprint.Data.Record#removeWriteGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeWriteGroup = function(group) {
  return this.removeGroup('write', group);
};

/**
 * Deauthorize a group from destroying this record
 * @function Blueprint.Data.Record#removeDestroyGroup
 * @param group {Blueprint.Group} - The group you would like to remove
 */
Record.prototype.removeDestroyGroup = function(group) {
  return this.removeGroup('destroy', group);
};

/*
 * Files
 */

/**
  * Creates a file object to be uploaded to the server
  * @function Blueprint.Data.Record#createFile
  * @param name {string} - The name of the file to upload
  * @param data {blob} - The data you would like to upload
  */
Record.prototype.createFile = function(name, data) {
  var Files = require(15);
  return new Files.File(name, this, data);
};

/**
  * Creates a file object to be uploaded to the server
  * @function Blueprint.Data.Record#getFileWithName
  * @param fileName {string} - The name of the file to get
  * @returns File
  */
Record.prototype.getFileWithName = function(fileName) {
  return this.files[fileName];
};

/**
  * Saves the record in the database
  * @function Blueprint.Data.Record#save
  * @returns Promise
  */
Record.prototype.save = function() {
  var promise = new Utils.promise();
  var that = this;
  var data = {
    id: this.object.id,
    content: this.object.content,
    permissions: this.object.permissions,
  };

  if (this.object.user) {
    data.user = this.object.user;
  }

  if (typeof this.object.subscription_keys !== 'undefined') {
    data.subscription_keys = this.object.subscription_keys;
  }

  if(typeof this.object.id === 'undefined') {
    this.object.created_at = new Date() / 1000;
  }

  this.object.updated_at = new Date() / 1000;

  var _saveFilesIndex = 0;

  var _saveFiles = function(filesNeedingSaving, promise) {
    var file = filesNeedingSaving[_saveFilesIndex];

    console.log(file, _saveFilesIndex);

    if(typeof file === 'undefined') {
      promise.send(false, that);
    } else {
      file.save().then(function(){
        _saveFiles(filesNeedingSaving, promise, _saveFilesIndex++);
      }).fail(function() {
        _saveFiles(filesNeedingSaving, promise, _saveFilesIndex++);
      });
    }

  }


  Adapter.Records.write(this.endpoint, data, function(returnData) {
    if (typeof returnData === 'undefined') {
      promise.send(true, that.object);
    } else {
      that.object = returnData;
      that._serverObjectContent = JSON.stringify(returnData.content);

      var filesNeedingSaving = Object.values(that.files).filter(function(file) {
        return file._shouldSave;
      });

      if(filesNeedingSaving.length === 0) {
        promise.send(false, that);
      } else {
        _saveFiles(filesNeedingSaving, promise);
      }
    }
  });

  return promise;
};

/**
  * Removes the record in the database
  * @function Blueprint.Data.Record#destroy
  * @returns Promise
  */
Record.prototype.destroy = function() {
  var promise = new Utils.promise();

  Adapter.Records.destroy(this.endpoint, this.get('id'), function(data) {
    if (typeof data === 'undefined') {
      promise.send(true);
    } else {
      promise.send(false);
    }
  });

  return promise;
};

/**
  * Triggers an update notification for the record
  * @function Blueprint.Data.Record#trigger
  * @returns Promise
  */
Record.prototype.trigger = function() {
  var promise = new Utils.promise();

  Adapter.Records.trigger(this.endpoint, this.get('id'), function(data) {
    if (typeof data === 'undefined') {
      promise.send(true);
    } else {
      promise.send(false);
    }
  });
  return promise;
};

/**
  * Tests to see if the local object has been modified
  * @function Blueprint.Data.Record#didChange
  * @returns Boolean
  */
Record.prototype.didChange = function() {
  var localObjectContent = JSON.stringify(this.object.content);
  return localObjectContent !== this._serverObjectContent;
};



Record.prototype.update = function(data) {
  var results = [];

  if(data.isBlueprintObject) {
    var data = data.object;

    var deepCopyInto = function(object, into) {
      if(Array.isArray(object) && !Array.isArray(into)) {
        into = [];
      } else if(typeof object === 'object' && typeof into !== 'object') {
        into = {};
      }

      for(var key in object) {
        var value = object[key];
        var type = typeof value;
        if(type === 'object') {
          into[key] = deepCopyInto(object[key], into[key]);
        } else {
          into[key] = value;
        }
      }

      return into;
    }

    this.object.created_at = -1;

    deepCopyInto(data, this.object);
  } else {
    for (var key in data) {
      var value = data[key];
      results.push(this.set(key, value));
    }
  }

  return results;
}

Record.prototype.addSubscriptionKey = function(key) {
  var keys = this.getSubscriptionKeys();

  if(keys.indexOf(key) === -1) {
    keys.push(key);
  }
}

Record.prototype.removeSubscriptionKey = function(key) {
  var keys = this.getSubscriptionKeys();
  var index = keys.indexOf(key);

  if(index !== -1) {
    keys.splice(index, 1);
  }
}

Record.prototype.getSubscriptionKeys = function() {
  var keys = this.object.subscription_keys;

  if(typeof this.object.subscription_keys === 'undefined' || this.object.subscription_keys === null) {
    keys = [];
    this.object.subscription_keys = keys;
  }

  return keys;
}
/**
  * Allows you to subclass this class
  * @function Blueprint.Data.Record.Extend
  * @returns Blueprint.Data.Record
  * @param object {object} - The object you would like to inject
  */
Record.extend = function(object) {
  object.prototype = Utils.extend(this.prototype, object.prototype);
  return object;
};

module.exports = Record;

},{"14":14,"15":15,"32":32,"39":39,"8":8}],25:[function(require,module,exports){
'use strict';

var Auth = require(7);
var CurrentUser = require(27);

/**
  * Allows you to authorize your user account
  * @function Blueprint.Authenticate
  * @param data {object} - The login object
  * @returns Promise
  */
var Authenticate = function(data) {
  var promise = Auth.Authenticate(data);

  promise.then(function(user) {
    CurrentUser.setCachedUser(user);
  });

  return promise;
};

/**
  * Restores the existing auth session
  * @function Blueprint.RestoreSession
  * @returns Bool - true if restore was successful
  */
var RestoreSession = function(callback) {
  if(callback) {
    Auth.RestoreSession(function(result) {
      if (result) {
        CurrentUser.GetCurrentUser();
      }

      callback(result);
    });
  } else {
    var result = Auth.RestoreSession();

    if (result) {
      CurrentUser.GetCurrentUser();
    }

    return result;
  }
};

module.exports = {
  Authenticate: Authenticate,
  RestoreSession: RestoreSession
};

},{"27":27,"7":7}],26:[function(require,module,exports){
'use strict';

var User = require(30);
var Auth = require(7);
var Utils = require(39);
var CurrentUser = require(27);

/**
  * Allows you to create a user account
  * @function Blueprint.Register
  * @param data {object} - The user object
  * @returns Promise
  */
var Register = function(properties) {
  var currentUser = require(27);
  currentUser.Logout();

  var promise = new Utils.promise();
  var user = new User({
    user: properties
  });

  user.save().then(function(user) {
    Auth.setCurrentUser(user.object);
    CurrentUser.setCachedUser(user.object);
    promise.send(false, user);
  }).fail(function(error) {
    promise.send(error);
  });

  return promise;
};

module.exports = {
  Register: Register
};

},{"27":27,"30":30,"39":39,"7":7}],27:[function(require,module,exports){
'use strict';

var Adapter = require(8);
var Utils = require(39);

var Session = require(32);

var cachedUser;
var cachedUserLoaded;
var currentUserPromise;

var setCachedUser = function(currentUserData) {
  var User = require(30);

  cachedUser = new User(currentUserData);
  Session.set('cached_user', currentUserData);
};


/**
  * Allows you to retrive the current user object
  * @function Blueprint.GetCurrentUser
  * @returns Blueprint.User
  */

var GetCurrentUser = function(noCache) {
  // If there is already a cached user object
  // and we're not disabling the cache
  if(cachedUser && !noCache) {
    var promise = new Utils.promise();
    promise.send(false, cachedUser);
    return promise;
  // If there is cached user being loaded
  // and we're not disabling the cache
  } else if (currentUserPromise && !noCache) {
    return currentUserPromise;
  // Otherwise, we need to load the user object
  // from the session or from the server
  }

  // Lets create our global promise so we don't hit the server unneedingly
  currentUserPromise = new Utils.promise();

  // Attempt to determine if we have a cached user in the session
  // if allowed
  var sessionCachedUser = Session.get('cached_user');

  // We do have a cached user, lets set it and send it
  if(typeof sessionCachedUser !== 'undefined' && !noCache) {
    setCachedUser(sessionCachedUser);

    currentUserPromise.send(false, cachedUser);

  // We do not have a cached user or we can't use it
  // lets get it from the server
  } else {
    Adapter.Auth.CurrentUser(function(currentUserData) {
      if (currentUserData) {
        setCachedUser(currentUserData);
        return currentUserPromise.send(false, cachedUser);
      }

      // There has been an error, error out
      return currentUserPromise.send(true);
    });
  }

  // Return the promise
  return currentUserPromise;
};

/**
  * Destroys the auth session
  * @function Blueprint.Logout
  */

var Logout = function() {
  cachedUser = undefined;
  cachedUserLoaded = false;

  Adapter.Auth.Logout();
};

module.exports = {
  GetCurrentUser: GetCurrentUser,
  Logout: Logout,

  setCachedUser: setCachedUser
};

},{"30":30,"32":32,"39":39,"8":8}],28:[function(require,module,exports){
'use strict';

var Adapter = require(8);
var Utils = require(39);

var User = require(30);

/**
  * Allows you to get a user by their id
  * @function Blueprint.FindUserById
  * @param id {string} - The id of the user you wish to retrieve
  * @returns Promise
  */

module.exports = function(id) {
  var promise = new Utils.promise();
  var path = 'users/' + id;

  Adapter.Api.post(path, {
    'id': id
  }, function(response) {
    var data = response.response.users[0];
    var user = new User(data);
    promise.send(false, user);
  }, true);

  return promise;
};

},{"30":30,"39":39,"8":8}],29:[function(require,module,exports){
'use strict';

var Create = require(26);
var CurrentUser = require(27);
var Find = require(28);
var Auth = require(25);
var User = require(30);

module.exports = {
  // Create
  User: User,
  Register: Create.Register,

  // Existing
  GetCurrentUser: CurrentUser.GetCurrentUser,
  Logout: CurrentUser.Logout,

  // Create Sessions
  Authenticate: Auth.Authenticate,
  RestoreSession: Auth.RestoreSession,

  FindUserById: Find
};

},{"25":25,"26":26,"27":27,"28":28,"30":30}],30:[function(require,module,exports){
'use strict';

var Utils = require(39);
var Adapter = require(8);
var CurrentUser = require(27);


/**
 * Creates a new user object
 * @name Blueprint.User
 * @class
 * @returns Blueprint.User
 */

var User = function(data) {
  this.isBlueprintObject = true;
  this.endpoint = 'users';
  this.object = data;
  return this;
};

/**
  * Get a value for the user
  * @function Blueprint.User#get
  * @returns Promise
  */

User.prototype.get = function(key) {
  return this.object[key];
};


/**
  * Remove the user from the database
  * @function Blueprint.User#destroy
  * @returns Promise
  */

User.prototype.destroy = function() {

  var promise = new Utils.promise();

  var id = this.get('id');

  Adapter.Records.destroy(this.endpoint, id, function(data) {
    if (data) {
      CurrentUser.GetCurrentUser().then(function(user) {
        if (user.get('id') === id) {
          CurrentUser.Logout();
        }

        promise.send(false);
      }).fail(function() {
        promise.send(false);
      });
    } else {
      promise.send(true);
    }
  });

  return promise;
};

/**
  * Save the user in the database
  * @function Blueprint.User#save
  * @returns Promise
  */

User.prototype.save = function() {
  var promise = new Utils.promise();
  var that = this;
  var data = {
    id: this.object.id,
    content: this.object.content,
    permissions: this.object.permissions
  };

  if (this.object.user) {
    data.user = this.object.user;
  }

  Adapter.Records.write(this.endpoint, data, function(returnData) {
    if (typeof returnData === 'undefined') {
      promise.send(true, that.object);
    } else {
      that.object = returnData;
      promise.send(false, that);
    }
  });

  return promise;
};

module.exports = User;

},{"27":27,"39":39,"8":8}],31:[function(require,module,exports){
(function (global){
'use strict';

var Data = require(19);
var Config = require(10);
var Utils = require(39);
/**
 * Main Entrypoint for Blueprint
 * @namespace
**/

var Blueprint = {};

Blueprint.init = Config.Init;

// Groups
Blueprint.publicGroup = Data.Groups.PublicGroup;
Blueprint.privateGroup = Data.Groups.PrivateGroup;
Blueprint.createGroup = Data.Groups.CreateGroup;
Blueprint.groupWithId = Data.Groups.GroupWithId;
Blueprint.Group = Data.Groups.Group;
// Data

/**
 * Used for interacting with records that do not have a model
 * @namespace
 */
Blueprint.Data = {};

Blueprint.Data.Record = Data.Records.Record;
Blueprint.Data.find = Data.Records.Find;
Blueprint.Data.findOne = Data.Records.FindOne;

Blueprint.Model = Data.Models.Model;

// User
Blueprint.getCurrentUser = Data.Users.GetCurrentUser;
Blueprint.register = Data.Users.Register;

// Sessions
Blueprint.authenticate = Data.Users.Authenticate;
Blueprint.restoreSession = Data.Users.RestoreSession;
Blueprint.logout = Data.Users.Logout;

Blueprint.Promise = Utils.promise;

if (typeof global !== 'undefined' &&
    global.navigator &&
    global.navigator.product === 'ReactNative') {

  module.exports = Blueprint;

} else if (typeof window !== 'undefined') {

  var hasModule = typeof module !== 'undefined';

  if (window.Blueprint === true || !hasModule) {
    window.Blueprint = Blueprint;
  } else {
    module.exports = Blueprint;
  }
} else {
  module.exports = Blueprint;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"10":10,"19":19,"39":39}],32:[function(require,module,exports){
(function (global){
'use strict';

var currentSession = {}

var AsyncStorage;

if (typeof global !== 'undefined' &&
    global.navigator &&
    global.navigator.product === 'ReactNative') {
    AsyncStorage = require(33);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"33":33}],33:[function(require,module,exports){
module.exports = {};

},{}],34:[function(require,module,exports){
'use strict';

module.exports = function(alpha) {
  var alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    base = alphabet.length;
  return {
    encodeBigInt: function(enc) {
      var bigInt = require(35);
      var remainder = Array(enc.length);
      var bigBase = bigInt.int2bigInt(base, 10);
      var encoded = '';
      while (parseInt(bigInt.bigInt2str(enc, 10))) {
        bigInt.divide(enc, bigBase, enc, remainder);
        encoded = alphabet[parseInt(bigInt.bigInt2str(remainder, 10))].toString() + encoded;
      }
      return encoded;
    }
  };
}();

},{"35":35}],35:[function(require,module,exports){
/* jshint ignore:start */

digitsStr = '0123456789abcdef';
for (bpe = 0; 1 << bpe + 1 > 1 << bpe; bpe++) ;
bpe >>= 1;
mask = (1 << bpe) - 1;
radix = (1 << bpe) + 1;
s6 = new Array(0);
function negative(x) {
  return x[x.length - 1] >> bpe - 1 & 1;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function greaterShift(x, y, shift) {
  var i,
    kx = x.length,
    ky = y.length;
  var k = kx + shift < ky ? kx + shift : ky;
  for (i = ky - 1 - shift; i < kx && i >= 0; i++)
    if (x[i] > 0)
      return 1;
  //if there are nonzeros in x to the left of the first column of y, then x is bigger
  for (i = kx - 1 + shift; i < ky; i++)
    if (y[i] > 0)
      return 0;
  //if there are nonzeros in y to the left of the first column of x, then x is not bigger
  for (i = k - 1; i >= shift; i--)
    if (x[i - shift] > y[i])
      return 1;else if (x[i - shift] < y[i])
      return 0;
  return 0;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function divide_(x, y, q, r) {
  var kx,
    ky;
  var i,
    j,
    y1,
    y2,
    c,
    a,
    b;
  copy_(r, x);
  for (ky = y.length; y[ky - 1] === 0; ky--) ;
  //ky is number of elements in y, not including leading zeros
  //normalize: ensure the most significant element of y has its highest bit set
  b = y[ky - 1];
  for (a = 0; b; a++)
    b >>= 1;
  a = bpe - a;
  //a is how many bits to shift so that the high order bit of y is leftmost in its array element
  leftShift_(y, a);
  //multiply both by 1<<a now, then divide both by that at the end
  leftShift_(r, a);
  //Rob Visser discovered a bug: the following line was originally just before the normalization.
  for (kx = r.length; r[kx - 1] === 0 && kx > ky; kx--) ;
  //kx is number of elements in normalized x, not including leading zeros
  copyInt_(q, 0);
  // q=0
  while (!greaterShift(y, r, kx - ky)) {
    // while (leftShift_(y,kx-ky) <= r) {
    subShift_(r, y, kx - ky);
    //   r=r-leftShift_(y,kx-ky)
    q[kx-ky]++; //   q[kx-ky]++;
  }
  // }
  for (i = kx - 1; i >= ky; i--) {
    if (r[i] === y[ky - 1])
      q[i - ky] = mask;
    else
      q[i - ky] = Math.floor((r[i] * radix + r[i - 1]) / y[ky - 1]);
    //The following for(;;) loop is equivalent to the commented while loop,
    //except that the uncommented version avoids overflow.
    //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
    //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
    //    q[i-ky]--;
    for (;;) {
      y2 = (ky > 1 ? y[ky - 2] : 0) * q[i - ky];
      c = y2 >> bpe;
      y2 = y2 & mask;
      y1 = c + q[i - ky] * y[ky - 1];
      c = y1 >> bpe;
      y1 = y1 & mask;
      if (c === r[i] ? y1 === r[i - 1] ? y2 > (i > 1 ? r[i - 2] : 0) : y1 > r[i - 1] : c > r[i])
        q[i-ky]--;
      else
        break;
    }
    linCombShift_(r, y, -q[i - ky], i - ky);
    //r=r-q[i-ky]*leftShift_(y,i-ky)
    if (negative(r)) {
      addShift_(r, y, i - ky);
      //r=r+leftShift_(y,i-ky)
      q[i-ky]--;
    }
  }
  rightShift_(y, a);
  //undo the normalization step
  rightShift_(r, a); //undo the normalization step
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function int2bigInt(t, bits, minSize) {
  var i,
    k;
  k = Math.ceil(bits / bpe) + 1;
  k = minSize > k ? minSize : k;
  var buff = new Array(k);
  copyInt_(buff, t);
  return buff;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function str2bigInt(s, base, minSize) {
  var d,
    i,
    j,
    x,
    y,
    kk;
  var k = s.length;
  if (base === -1) {
    //comma-separated list of array elements in decimal
    x = new Array(0);
    for (;;) {
      y = new Array(x.length + 1);
      for (i = 0; i < x.length; i++)
        y[i + 1] = x[i];
      y[0] = parseInt(s, 10);
      x = y;
      d = s.indexOf(',', 0);
      if (d < 1)
        break;
      s = s.substring(d + 1);
      if (s.length === 0)
        break;
    }
    if (x.length < minSize) {
      y = new Array(minSize);
      copy_(y, x);
      return y;
    }
    return x;
  }
  x = int2bigInt(0, base * k, 0);
  for (i = 0; i < k; i++) {
    d = digitsStr.indexOf(s.substring(i, i + 1), 0);
    if (base <= 36 && d >= 36)
      //convert lowercase to uppercase if base<=36
      d -= 26;
    if (d >= base || d < 0) {
      //stop at first illegal character
      break;
    }
    multInt_(x, base);
    addInt_(x, d);
  }
  for (k = x.length; k > 0 && !x[k - 1]; k--) ;
  //strip off leading zeros
  k = minSize > k + 1 ? minSize : k + 1;
  y = new Array(k);
  kk = k < x.length ? k : x.length;
  for (i = 0; i < kk; i++)
    y[i] = x[i];
  for (; i < k; i++)
    y[i] = 0;
  return y;
}
function isZero(x) {
  var i;
  for (i = 0; i < x.length; i++)
    if (x[i])
      return 0;
  return 1;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function bigInt2str(x, base) {
  var i,
    t,
    s = '';
  if (s6.length !== x.length)
    s6 = dup(x);
  else
    copy_(s6, x);
  if (base === -1) {
    //return the list of array contents
    for (i = x.length - 1; i > 0; i--)
      s += x[i] + ',';
    s += x[0];
  } else {
    //return it in the given base
    while (!isZero(s6)) {
      t = divInt_(s6, base);
      //t=s6 % base; s6=floor(s6/base);
      s = digitsStr.substring(t, t + 1) + s;
    }
  }
  if (s.length === 0)
    s = '0';
  return s;
}
function dup(x) {
  var i;
  var buff = new Array(x.length);
  copy_(buff, x);
  return buff;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function copy_(x, y) {
  var i;
  var k = x.length < y.length ? x.length : y.length;
  for (i = 0; i < k; i++)
    x[i] = y[i];
  for (i = k; i < x.length; i++)
    x[i] = 0;
}
function copyInt_(x, n) {
  var i,
    c;
  for (c = n, i = 0; i < x.length; i++) {
    x[i] = c & mask;
    c >>= bpe;
  }
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function addInt_(x, n) {
  var i,
    k,
    c,
    b;
  x[0] += n;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i];
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
    if (!c)
      return; //stop carrying as soon as the carry is zero
  }
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function rightShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = 0; i < x.length - k; i++)
      //right shift x by k elements
      x[i] = x[i + k];
    for (; i < x.length; i++)
      x[i] = 0;
    n %= bpe;
  }
  for (i = 0; i < x.length - 1; i++) {
    x[i] = mask & (x[i + 1] << bpe - n | x[i] >> n);
  }
  x[i] >>= n;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function leftShift_(x, n) {
  var i;
  var k = Math.floor(n / bpe);
  if (k) {
    for (i = x.length; i >= k; i--)
      //left shift x by k elements
      x[i] = x[i - k];
    for (; i >= 0; i--)
      x[i] = 0;
    n %= bpe;
  }
  if (!n)
    return;
  for (i = x.length - 1; i > 0; i--) {
    x[i] = mask & (x[i] << n | x[i - 1] >> bpe - n);
  }
  x[i] = mask & x[i] << n;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function multInt_(x, n) {
  var i,
    k,
    c,
    b;
  if (!n)
    return;
  k = x.length;
  c = 0;
  for (i = 0; i < k; i++) {
    c += x[i] * n;
    b = 0;
    if (c < 0) {
      b = -(c >> bpe);
      c += b * radix;
    }
    x[i] = c & mask;
    c = (c >> bpe) - b;
  }
}
function divInt_(x, n) {
  var i,
    r = 0,
    s;
  for (i = x.length - 1; i >= 0; i--) {
    s = r * radix + x[i];
    x[i] = Math.floor(s / n);
    r = s % n;
  }
  return r;
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function linCombShift_(x, y, b, ys) {
  var i,
    c,
    k,
    kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] + b * y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }
  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}
/* istanbul ignore next: The code missed in tests will not be used in production */
function subShift_(x, y, ys) {
  var i,
    c,
    k,
    kk;
  k = x.length < ys + y.length ? x.length : ys + y.length;
  kk = x.length;
  for (c = 0, i = ys; i < k; i++) {
    c += x[i] - y[i - ys];
    x[i] = c & mask;
    c >>= bpe;
  }
  for (i = k; c && i < kk; i++) {
    c += x[i];
    x[i] = c & mask;
    c >>= bpe;
  }
}
module.exports = {
  divide: divide_,
  int2bigInt: int2bigInt,
  str2bigInt: str2bigInt,
  bigInt2str: bigInt2str
};

/* jshint ignore:end */

},{}],36:[function(require,module,exports){
'use strict';

module.exports = function(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function(source) {
    for (var prop in source) {
      target[prop] = source[prop];
    }
  });
  return target;
};

},{}],37:[function(require,module,exports){
/*
Modified for Blueprint by Hunter Dolan 2015

CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/* jshint ignore:start */
module.exports = function (data, key) {
  var CryptoJS = CryptoJS || function (h, s) {
    var f = {}, g = f.lib = {}, q = function () {
      }, m = g.Base = {
        extend: function (a) {
          q.prototype = this;
          var c = new q();
          a && c.mixIn(a);
          c.hasOwnProperty('init') || (c.init = function () {
            c.$super.init.apply(this, arguments);
          });
          c.init.prototype = c;
          c.$super = this;
          return c;
        },
        create: function () {
          var a = this.extend();
          a.init.apply(a, arguments);
          return a;
        },
        init: function () {
        },
        mixIn: function (a) {
          for (var c in a)
            a.hasOwnProperty(c) && (this[c] = a[c]);
          a.hasOwnProperty('toString') && (this.toString = a.toString);
        },
        clone: function () {
          return this.init.prototype.extend(this);
        }
      }, r = g.WordArray = m.extend({
        init: function (a, c) {
          a = this.words = a || [];
          this.sigBytes = c !== s ? c : 4 * a.length;
        },
        toString: function (a) {
          return (a || k).stringify(this);
        },
        concat: function (a) {
          var c = this.words, d = a.words, b = this.sigBytes;
          a = a.sigBytes;
          this.clamp();
          if (b % 4)
            for (var e = 0; e < a; e++)
              c[b + e >>> 2] |= (d[e >>> 2] >>> 24 - 8 * (e % 4) & 255) << 24 - 8 * ((b + e) % 4);
          else if (65535 < d.length)
            for (e = 0; e < a; e += 4)
              c[b + e >>> 2] = d[e >>> 2];
          else
            c.push.apply(c, d);
          this.sigBytes += a;
          return this;
        },
        clamp: function () {
          var a = this.words, c = this.sigBytes;
          a[c >>> 2] &= 4294967295 << 32 - 8 * (c % 4);
          a.length = h.ceil(c / 4);
        },
        clone: function () {
          var a = m.clone.call(this);
          a.words = this.words.slice(0);
          return a;
        },
        random: function (a) {
          for (var c = [], d = 0; d < a; d += 4)
            c.push(4294967296 * h.random() | 0);
          return new r.init(c, a);
        }
      }), l = f.enc = {}, k = l.Hex = {
        stringify: function (a) {
          var c = a.words;
          a = a.sigBytes;
          for (var d = [], b = 0; b < a; b++) {
            var e = c[b >>> 2] >>> 24 - 8 * (b % 4) & 255;
            d.push((e >>> 4).toString(16));
            d.push((e & 15).toString(16));
          }
          return d.join('');
        },
        parse: function (a) {
          for (var c = a.length, d = [], b = 0; b < c; b += 2)
            d[b >>> 3] |= parseInt(a.substr(b, 2), 16) << 24 - 4 * (b % 8);
          return new r.init(d, c / 2);
        }
      }, n = l.Latin1 = {
        stringify: function (a) {
          var c = a.words;
          a = a.sigBytes;
          for (var d = [], b = 0; b < a; b++)
            d.push(String.fromCharCode(c[b >>> 2] >>> 24 - 8 * (b % 4) & 255));
          return d.join('');
        },
        parse: function (a) {
          for (var c = a.length, d = [], b = 0; b < c; b++)
            d[b >>> 2] |= (a.charCodeAt(b) & 255) << 24 - 8 * (b % 4);
          return new r.init(d, c);
        }
      }, j = l.Utf8 = {
        stringify: function (a) {
          try {
            return decodeURIComponent(escape(n.stringify(a)));
          } catch (c) {
            throw Error('Malformed UTF-8 data');
          }
        },
        parse: function (a) {
          return n.parse(unescape(encodeURIComponent(a)));
        }
      }, u = g.BufferedBlockAlgorithm = m.extend({
        reset: function () {
          this._data = new r.init();
          this._nDataBytes = 0;
        },
        _append: function (a) {
          'string' === typeof a && (a = j.parse(a));
          this._data.concat(a);
          this._nDataBytes += a.sigBytes;
        },
        _process: function (a) {
          var c = this._data, d = c.words, b = c.sigBytes, e = this.blockSize, f = b / (4 * e), f = a ? h.ceil(f) : h.max((f | 0) - this._minBufferSize, 0);
          a = f * e;
          b = h.min(4 * a, b);
          if (a) {
            for (var g = 0; g < a; g += e)
              this._doProcessBlock(d, g);
            g = d.splice(0, a);
            c.sigBytes -= b;
          }
          return new r.init(g, b);
        },
        clone: function () {
          var a = m.clone.call(this);
          a._data = this._data.clone();
          return a;
        },
        _minBufferSize: 0
      });
    g.Hasher = u.extend({
      cfg: m.extend(),
      init: function (a) {
        this.cfg = this.cfg.extend(a);
        this.reset();
      },
      reset: function () {
        u.reset.call(this);
        this._doReset();
      },
      update: function (a) {
        this._append(a);
        this._process();
        return this;
      },
      finalize: function (a) {
        a && this._append(a);
        return this._doFinalize();
      },
      blockSize: 16,
      _createHelper: function (a) {
        return function (c, d) {
          return new a.init(d).finalize(c);
        };
      },
      _createHmacHelper: function (a) {
        return function (c, d) {
          return new t.HMAC.init(a, d).finalize(c);
        };
      }
    });
    var t = f.algo = {};
    return f;
  }(Math);
  (function (h) {
    for (var s = CryptoJS, f = s.lib, g = f.WordArray, q = f.Hasher, f = s.algo, m = [], r = [], l = function (a) {
          return 4294967296 * (a - (a | 0)) | 0;
        }, k = 2, n = 0; 64 > n;) {
      var j;
      a: {
        j = k;
        for (var u = h.sqrt(j), t = 2; t <= u; t++)
          if (!(j % t)) {
            j = !1;
            break a;
          }
        j = !0;
      }
      j && (8 > n && (m[n] = l(h.pow(k, 0.5))), r[n] = l(h.pow(k, 1 / 3)), n++);
      k++;
    }
    var a = [], f = f.SHA256 = q.extend({
        _doReset: function () {
          this._hash = new g.init(m.slice(0));
        },
        _doProcessBlock: function (c, d) {
          for (var b = this._hash.words, e = b[0], f = b[1], g = b[2], j = b[3], h = b[4], m = b[5], n = b[6], q = b[7], p = 0; 64 > p; p++) {
            if (16 > p)
              a[p] = c[d + p] | 0;
            else {
              var k = a[p - 15], l = a[p - 2];
              a[p] = ((k << 25 | k >>> 7) ^ (k << 14 | k >>> 18) ^ k >>> 3) + a[p - 7] + ((l << 15 | l >>> 17) ^ (l << 13 | l >>> 19) ^ l >>> 10) + a[p - 16];
            }
            k = q + ((h << 26 | h >>> 6) ^ (h << 21 | h >>> 11) ^ (h << 7 | h >>> 25)) + (h & m ^ ~h & n) + r[p] + a[p];
            l = ((e << 30 | e >>> 2) ^ (e << 19 | e >>> 13) ^ (e << 10 | e >>> 22)) + (e & f ^ e & g ^ f & g);
            q = n;
            n = m;
            m = h;
            h = j + k | 0;
            j = g;
            g = f;
            f = e;
            e = k + l | 0;
          }
          b[0] = b[0] + e | 0;
          b[1] = b[1] + f | 0;
          b[2] = b[2] + g | 0;
          b[3] = b[3] + j | 0;
          b[4] = b[4] + h | 0;
          b[5] = b[5] + m | 0;
          b[6] = b[6] + n | 0;
          b[7] = b[7] + q | 0;
        },
        _doFinalize: function () {
          var a = this._data, d = a.words, b = 8 * this._nDataBytes, e = 8 * a.sigBytes;
          d[e >>> 5] |= 128 << 24 - e % 32;
          d[(e + 64 >>> 9 << 4) + 14] = h.floor(b / 4294967296);
          d[(e + 64 >>> 9 << 4) + 15] = b;
          a.sigBytes = 4 * d.length;
          this._process();
          return this._hash;
        },
        clone: function () {
          var a = q.clone.call(this);
          a._hash = this._hash.clone();
          return a;
        }
      });
    s.SHA256 = q._createHelper(f);
    s.HmacSHA256 = q._createHmacHelper(f);
  }(Math));
  (function () {
    var h = CryptoJS, s = h.enc.Utf8;
    h.algo.HMAC = h.lib.Base.extend({
      init: function (f, g) {
        f = this._hasher = new f.init();
        'string' === typeof g && (g = s.parse(g));
        var h = f.blockSize, m = 4 * h;
        g.sigBytes > m && (g = f.finalize(g));
        g.clamp();
        for (var r = this._oKey = g.clone(), l = this._iKey = g.clone(), k = r.words, n = l.words, j = 0; j < h; j++)
          k[j] ^= 1549556828, n[j] ^= 909522486;
        r.sigBytes = l.sigBytes = m;
        this.reset();
      },
      reset: function () {
        var f = this._hasher;
        f.reset();
        f.update(this._iKey);
      },
      update: function (f) {
        this._hasher.update(f);
        return this;
      },
      finalize: function (f) {
        var g = this._hasher;
        f = g.finalize(f);
        g.reset();
        return g.finalize(this._oKey.clone().concat(f));
      }
    });
  }());
  return CryptoJS.HmacSHA256(data, key).toString();
};  /* jshint ignore:end */
},{}],38:[function(require,module,exports){
(function (global){
'use strict';

var reactRequest = function(options, data, callback) {

  var url = options.protocol + '//' + options.host + ':' + options.port + options.path;
  var postOptions = {
    method: options.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  };

  if(global.__DEV__) {
    //console.log("HTTP Request > ", url, JSON.parse(data), postOptions.method);
  }

  try {
    fetch(url, postOptions).then(function(response) {
      response.json().then(function(response){
        callback(response);
      });
    }).catch(function(){
      callback();
    }).done();
  } catch(e) {
    callback();
  }

};



module.exports = {
  send: function(options, callback, retryCount) {
    var xmlhttp;
    var url = this.buildUrl(options);
    var data = JSON.stringify(options.data);
    if (typeof retryCount === 'undefined') {
      retryCount = 0;
    }
    var that = this;
    var handled = false;
    function handleRetry() {

      if (retryCount >= 10 || options.method !== 'POST' || (options.path.indexOf("/query") === -1 && options.path.indexOf("/users") !== 0)) {
        console.log("[RECOVERY] RECOVERY FAILED", retryCount, options, url);
        callback();
      } else if(retryCount > 5) {
        setTimeout(function(){
          console.log("[RECOVERY] Request Failed attempting recovery in ", Math.pow(3,retryCount), " ms", url);
          that.send(options, callback, retryCount + 1);
        }, Math.pow(3,retryCount));
      } else {
        console.log("[RECOVERY] Request Failed attempting recovery", url);
        that.send(options, callback, retryCount + 1);
      }
    }

    function handle(data) {
      if (!handled) {
        handled = true;

        if (data === null || typeof data === 'undefined' || data === '') {
          handleRetry();
        } else {
          try {

            if(typeof data === 'string') {
              data = JSON.parse(data);
            }

            if (data.error) {
              handleRetry();
            } else {
              callback(data);
            }
          } catch (e) {
            console.log("Failure upon handle callback", e);
            handleRetry();
          }
        }
      }
    }
    /* istanbul ignore else  */

    var isReact = typeof global !== 'undefined' &&
      global.navigator && global.navigator.product === 'ReactNative';

    var isNode = !isReact && typeof global !== 'undefined' && typeof global.navigator === 'undefined'

    if (isNode) {
      require('./node_request.js')(options, data, handle);
    } else {
      if(isReact) {
        xmlhttp = new XMLHttpRequest();
      } else if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        /* jshint ignore:start */
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
      /* jshint ignore:end */
      }
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
          handle(xmlhttp.responseText);
        }
      };
      xmlhttp.onerror = function() {
        handle();
      };
      xmlhttp.open(options.method, url);
      xmlhttp.setRequestHeader('Content-type', 'application/json');
      xmlhttp.send(data);
    }
  },

  buildUrl: function(options) {
    var url = options.protocol;
    url += '//';
    url += options.host;
    url += ':' + options.port;
    url += options.path;
    return url;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"undefined":undefined}],39:[function(require,module,exports){
'use strict';

module.exports = {
  base58: require(34),
  hmac: require(37),
  bigInt: require(35),
  extend: require(36),
  http: require(38),
  promise: require(40)
};

},{"34":34,"35":35,"36":36,"37":37,"38":38,"40":40}],40:[function(require,module,exports){
'use strict';

var promise;
promise = function() {
  this.sent = false;
  this.error = false;

  this.data = void 0;
  this.meta = void 0;

  this.successCallbacks = [];
  this.errorCallbacks = [];

  this.send = function(error, data, meta) {
    this.error = error;
    this.data = data;
    this.sent = true;
    if (meta) {
      this.meta = meta;
    }

    var callbacks = this.successCallbacks;
    var response = this.data;

    if (this.error) {
      callbacks = this.errorCallbacks;
      response = this.error;
    }

    var results = [];

    for (var i in callbacks) {
      try {
        results.push(callbacks[i](response, this.meta));
      } catch(e) {
        console.log('Failure upon send', e);
      }
    }

    return results;
  };

  this.fail = function(newCallback) {
    this.errorCallbacks.push(newCallback);

    if (this.sent === true) {
      if (this.error) {
        try {
          newCallback(this.data, this.meta);
        } catch(e) {
          console.log('Failure upon send', e);
        }
      }
    }

    return this;
  };

  this.catch = this.fail;

  this.then = function(okCallback, failCallback) {

    this.successCallbacks.push(okCallback);

    if (failCallback) {
      this.errorCallbacks.push(failCallback);
    }

    if (this.sent === true) {
      if (this.data && !this.error) {
        try {
          var result = okCallback(this.data, this.meta);

          if(typeof result !== 'undefined') {
            this.data = result;
          }

        } catch(e) {
          console.log('Failure upon send', e);
        }
      } else if (failCallback) {
        try {
          failCallback(this.error, this.meta);
        } catch(e) {
          console.log('Failure upon send', e);
        }
      }
    }

    return this;
  };

  return this;
};

module.exports = promise;

},{}]},{},[31]);
