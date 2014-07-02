'use strict';
var through = require('through2');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var convert = require('convert-source-map');

var PLUGIN_NAME = 'gulp-sourcemap';

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
      return callback(new Error(PLUGIN_NAME + ': Streaming not supported'));
    }

    var map = {
      version : 3,
      file: file.relative,
      names: [],
      mappings: '',
      sources: [file.relative],
      sourcesContent: [file.contents.toString()]
    };

    var embeddedMap = convert.fromSource(file.contents.toString());

    file.sourceMap = embeddedMap ? embeddedMap.toObject() : map;

    var str = convert.removeComments(file.contents.toString());
    file.contents = new Buffer(str, 'utf8');

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
      return callback(new Error(PLUGIN_NAME + ': Streaming not supported'));
    }

    var sourceMap = file.sourceMap;
    sourceMap.file = file.relative;

    if (options.sourceRoot)
      sourceMap.sourceRoot = options.sourceRoot;

    if (options.includeContent) {
      sourceMap.sourceRoot = options.sourceRoot || '/source/';
      sourceMap.sourcesContent = sourceMap.sourcesContent || [];

      // load missing source content
      for (var i = 0; i < file.sourceMap.sources.length; i++) {
        if (!sourceMap.sourcesContent[i]) {
          var sourcePath = path.resolve(file.base, sourceMap.sources[i]);
          try {
            sourceMap.sourcesContent[i] = fs.readFileSync(sourcePath).toString();
          } catch (e) {
            console.warn(PLUGIN_NAME + ': source file not found:' + sourcePath);
          }
        }
      }
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
      var sourceMapFile = new File({
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
