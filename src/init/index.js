'use strict';
var utils = require('../utils');
var unixStylePath = utils.unixStylePath;
var through = require('through2');
var initInternals = require('./index.internals');

/**
 * Initialize source mapping chain
 */
function init(_options) {
  var debug = require('../debug').spawn('init');
  var options = _options || {};

  function sourceMapInit(file, encoding, callback) {
    /*jshint validthis:true */

    // pass through if file is null or already has a source map
    if (file.isNull() || file.sourceMap) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(
        new Error(utils.PLUGIN_NAME + '-init: Streaming not supported')
      );
    }

    debug(function() {
      return options;
    });

    var fileContent = file.contents.toString();
    var sourceMap, preExistingComment;
    var internals = initInternals(options, file, fileContent);

    if (options.loadMaps) {
      var result = internals.loadMaps();
      sourceMap = result.map;
      fileContent = result.content;
      preExistingComment = result.preExistingComment;
    }

    if (!sourceMap) {
      // Make an empty source map
      sourceMap = {
        version: 3,
        names: [],
        mappings: '',
        sources: [unixStylePath(file.relative)],
        sourcesContent: [fileContent]
      };
    } else if (
      preExistingComment !== null &&
      typeof preExistingComment !== 'undefined'
    )
      sourceMap.preExistingComment = preExistingComment;

    sourceMap.file = unixStylePath(file.relative);
    file.sourceMap = sourceMap;

    this.push(file);
    callback();
  }
  return through.obj(sourceMapInit);
}

module.exports = init;
