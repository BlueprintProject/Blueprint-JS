'use strict';

var utils = require('../../utils');
var Cable = require('../cable');
var Listener = require('../cable/listener');

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

  var utils = require('../../utils');

  var inject = function(obj) {
   if(instanceCode === false) {
     return obj;
   } else {
     return instanceCode.call(obj);
   }
  };

  var constructor = function(baseData, preNested) {
    var Record = require('../records/record');

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
    require('../records/find').Find(name, where).then(function(results) {
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
    require('../records/find').FindOne(name, where).then(function(result) {
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
