'use strict';
var path = require('path'),
  detectNewline = require('detect-newline');

function unixStylePath(filePath) {
  return filePath.split(path.sep).join('/');
}

var PLUGIN_NAME = require('../package.json').name;

var urlRegex = /^(https?|webpack(-[^:]+)?):\/\//;

var debug = require('debug-fabulous')()(PLUGIN_NAME + ':utils');

var sourceMapUrlRegEx = /\/\/\# sourceMappingURL\=.*/g


var getCommentFormatter = function (file) {
  var extension = file.relative.split('.').pop(),
    fileContents =  file.contents.toString(),
    newline =  detectNewline.graceful(fileContents || ''),
    commentFormatter = function(url) {
      return '';
    };

  if (file.sourceMap.preExisting){
    debug('preExisting commentFormatter');
    commentFormatter = function(url) {
      return file.sourceMap.preExisting;
    };
    return commentFormatter
  }

  switch (extension) {
    case 'css':
      debug('css commentFormatter');
      commentFormatter = function(url) {
        return newline + "/*# sourceMappingURL=" + url + " */" + newline;
      };
      break;
    case 'js':
      debug('js commentFormatter');
      commentFormatter = function(url) {
        return newline + "//# sourceMappingURL=" + url + newline;
      };
      break;
    default:
      debug('unknown commentFormatter')
  }

  return commentFormatter;
}

var getPreExisting = function(fileContent){
  if(sourceMapUrlRegEx.test(fileContent)){
    debug('has preExisting');
    return fileContent.match(sourceMapUrlRegEx)[0];
  }
}

module.exports = {
  unixStylePath: unixStylePath,
  PLUGIN_NAME: PLUGIN_NAME,
  urlRegex: urlRegex,
  sourceMapUrlRegEx: sourceMapUrlRegEx,
  getCommentFormatter: getCommentFormatter,
  getPreExisting: getPreExisting
};
