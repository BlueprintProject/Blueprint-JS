'use strict';
var Record = require('./record');
var Utils = require('../../utils');
var Adapter = require('../../adapter');

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
    if (data) {
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
