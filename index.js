'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');
var SourceMapGenerator = require('source-map').SourceMapGenerator;
var SourceMapConsumer = require('source-map').SourceMapConsumer;

var PLUGIN_NAME = 'gulp-sourcemap';

/**
 * Apply source map to the end of the source map chain
 *
 * @param sourceMap source map to be appended
 */
function applySourceMap(sourceMap) {
  /*jshint validthis:true */
  try {
    if (typeof sourceMap === 'string' || sourceMap instanceof String) {
      sourceMap = JSON.parse(sourceMap);
    }
    var generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(sourceMap));
    generator.applySourceMap(new SourceMapConsumer(this.sourceMap));
    this.sourceMap = JSON.parse(generator.toString());
  } catch (e) {
    gutil.log(gutil.colors.red('Error applying source map:'));
    console.error(e.stack);
  }
}

/**
 * Initialize source mapping chain
 */
module.exports.init = function init() {
  function sourceMapInit(file, encoding, callback) {
    /*jshint validthis:true */

    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    // initialize source map
    file.sourceMap = {
      version : 3,
      file: file.relative,
      names: [],
      mappings: '',
      sources: [file.relative],
      sourcesContent: [file.contents.toString()]
    };

    // add helper method to vinyl file
    file.applySourceMap = applySourceMap;

    this.push(file);
    callback();
  }

  return through.obj(sourceMapInit);
};

/**
 * Write the source map
 *
 * @param options options to change the way the source map is written
 *
 */
module.exports.write = function write(destPath, options) {
  if (options === undefined && Object.prototype.toString.call(destPath) === '[object Object]') {
    options = destPath;
    destPath = undefined;
  }
  options = options || {};

  // set defaults for options if unset
  if (options.includeContent === undefined)
    options.includeContent = true;
  if (options.addComment === undefined)
    options.addComment = true;

  function sourceMapWrite(file, encoding, callback) {
    /*jshint validthis:true */

    if (file.isNull() || !file.sourceMap) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    var sourceMap = file.sourceMap;
    sourceMap.file = file.relative;

    if (options.sourceRoot)
      sourceMap.sourceRoot = options.sourceRoot;

    if (options.includeContent) {
      sourceMap.sourceRoot = options.sourceRoot || '/source/';
    } else {
      delete sourceMap.sourcesContent;
    }

    var extension = file.relative.split('.').pop();
    var commentFormatter;

    switch (extension) {
      case 'css':
        commentFormatter = function(url) { return "\n/*# sourceMappingURL=" + url + " */"; };
        break;
      case 'js':
      /* falls through */
      default:
        commentFormatter = function(url) { return "\n//# sourceMappingURL=" + url; };
    }

    var comment;
    if (!destPath) {
      // encode source map into comment
      var base64Map = new Buffer(JSON.stringify(sourceMap)).toString('base64');
      comment = commentFormatter('data:application/json;base64,' + base64Map);
    } else {
      // add new source map file to stream
      var sourceMapFile = new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: path.join(file.base, destPath, file.relative) + '.map',
        contents: new Buffer(JSON.stringify(sourceMap))
      });
      this.push(sourceMapFile);

      comment = commentFormatter(path.join(path.relative(path.dirname(file.path), file.base), destPath, file.relative) + '.map');
    }

    // append source map comment
    if (options.addComment)
      file.contents = Buffer.concat([file.contents, new Buffer(comment)]);

    this.push(file);
    callback();
  }

  return through.obj(sourceMapWrite);
};

module.exports.dest = function dest(options) {
  options = options || {};

  function sourceMapFilesWrite(file, encoding, callback) {
    /*jshint validthis:true */

  }

  return through.obj(sourceMapFilesWrite);
};
