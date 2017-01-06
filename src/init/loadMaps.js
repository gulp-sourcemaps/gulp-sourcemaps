'use strict';

var utils = require('../utils');
var PLUGIN_NAME = utils.PLUGIN_NAME;
var debug = require('debug-fabulous')()(PLUGIN_NAME + ':init:loadMaps');
var convert = require('convert-source-map');
var stripBom = require('strip-bom');
var urlRegex = utils.urlRegex;
var fs = require('graceful-fs');
var path = require('path');
var unixStylePath = utils.unixStylePath;


module.exports = function loadMaps (lOpts, options) {
  debug('loadMaps');
  var fileContent = lOpts.fileContent;
  var file = lOpts.file;

  var sources = { path: '', map: null , content: fileContent, preExistingComment: null};

  _getInlineSources({sources:sources, file:file, options:options});
  if (!sources.map) // ahh not inline, so try file
    _getFileSources({sources:sources, file:file});

  _fixSources({sources: sources, file: file, options: options});

  return sources;
};

function _fixSources(args) {
  var sources = args.sources;
  var file = args.file;
  var options = args.options;

  // fix source paths and sourceContent for imported source map
  if (sources.map) {
    sources.map.sourcesContent = sources.map.sourcesContent || [];
    sources.map.sources.forEach(function(source, i) {
      if (source.match(urlRegex)) {
        sources.map.sourcesContent[i] = sources.map.sourcesContent[i] || null;
        return;
      }
      var absPath = path.resolve(sources.path, source);
      sources.map.sources[i] = unixStylePath(path.relative(file.base, absPath));

      if (!sources.map.sourcesContent[i]) {
        var sourceContent = null;
        if (sources.map.sourceRoot) {
          if (sources.map.sourceRoot.match(urlRegex)) {
            sources.map.sourcesContent[i] = null;
            return;
          }
          absPath = path.resolve(sources.path, sources.map.sourceRoot, source);
        }

        // if current file: use content
        if (absPath === file.path) {
          sourceContent = sources.content;

          // else load content from file
        } else {
          try {
            if (options.debug)
              debug('No source content for "' + source + '". Loading from file.');
            sourceContent = stripBom(fs.readFileSync(absPath, 'utf8'));
          } catch (e) {
            if (options.debug)
              debug('warn: source file not found: ' + absPath);
            }
          }
        sources.map.sourcesContent[i] = sourceContent;
      }

    });
    // remove source map comment from source
    file.contents = new Buffer(sources.content, 'utf8');
  }

}

function _getInlineSources(args) {
  var sources = args.sources,
  file = args.file,
  options = args.options;

  sources.preExistingComment = utils.getInlinePreExisting(sources.content);
  // Try to read inline source map
  sources.map = convert.fromSource(sources.content, options.largeFile);

  if (!sources.map)
    return sources;

  sources.map = sources.map.toObject();
  // sources in map are relative to the source file
  sources.path = path.dirname(file.path);
  if (!options.largeFile) {
    debug('comment REMOVED');
    sources.content = convert.removeComments(sources.content);
  }
}

function _getFileSources(args) {
  var sources = args.sources,
  file = args.file;
  // look for source map comment referencing a source map file
  var mapComment = convert.mapFileCommentRegex.exec(sources.content);

  var mapFile;
  if (mapComment) {
    sources.preExistingComment = mapComment[1] || mapComment[2];
    mapFile = path.resolve(path.dirname(file.path), sources.preExistingComment);
    sources.content = convert.removeMapFileComments(sources.content);
    // if no comment try map file with same name as source file
  } else {
    mapFile = file.path + '.map';
  }

  // sources in external map are relative to map file
  sources.path = path.dirname(mapFile);

  try {
    sources.map = JSON.parse(stripBom(fs.readFileSync(mapFile, 'utf8')));
  } catch (e) {}//should we really swallow this error?
}
