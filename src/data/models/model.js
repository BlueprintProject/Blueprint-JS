'use strict';

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

  if(typeof arg1 === 'function') {
   instanceCode = arg1;
  } else if(typeof arg1 === 'object') {
   modelStructure = arg1;
  }

  if(typeof arg2 === 'function') {
   instanceCode = arg2;
  }

  var utils = require('../../utils');

  var inject = function(obj) {
   console.log(instanceCode);
   if(instanceCode === false) {
     return obj;
   } else {
     return instanceCode.call(obj);
   }
  };

  var constructor = function(baseData, preNested) {
    var Record = require('../records/record');

    var recordObject;

    if (preNested) {
      recordObject = new Record(name, baseData, true);
    } else {
      recordObject = new Record(name, {});

      if (baseData) {
        recordObject.update(baseData);
      }
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
    var promise = new utils.promise();
    require('../records/find').Find(name, where).then(function(results) {
      var that = this;

      results = results.map(function(result){
        return new that(result);
      });

      return promise.send(void 0, results);
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
    require('../records/find').FindOne(name, where).then(function(result) {
      result = new this(result);
      return promise.send(void 0, result);
    }).fail(function(error) {
      return promise.send(error);
    });
    return promise;
  };

  var createStructure = function(structure) {
    for(var key in structure) {
      var item = structure[key];

      if(typeof item === 'function') {
        item = {type: item};
      }

      if(typeof this[key] === 'undefined') {
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
    this._record.update(object);
    this.sync();
  }

  constructor.prototype.save = function() {
    this.sync();
    this._record.save();
  }

  constructor.prototype.sync = function() {
    for(var key in this._keyMap) {
      ensureKey.call(this, key);
    }
  }

  return constructor;
};

module.exports = Model;
