'use strict';

var extend = require('./utils/extend');

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
