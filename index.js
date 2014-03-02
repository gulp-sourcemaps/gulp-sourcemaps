'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');

var PLUGIN_NAME = 'gulp-sourcemap';

module.exports = function(options) {
	options = options || {};

	if (options.includeContent === undefined)
		options.includeContent = true;
	if (options.inline === undefined)
		options.inline = true;

	function sourcemap(file, encoding, callback) {
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
			sourceMap.sourcesContent = sourceMap.sourcesContent || new Array(sourceMap.sources.length);
			sourceMap.sources.forEach(function(source, i) {
				if (!sourceMap.sourcesContent[i])
					try {
						sourceMap.sourcesContent[i] = fs.readFileSync(path.join(file.base, source)).toString();
					} catch(e) {
						sourceMap.sourcesContent[i] = null;
					}
			});
			sourceMap.sourceRoot = options.sourceRoot || '/source/';
		}

		var comment;
		if (options.inline) {
			var base64Map = new Buffer(JSON.stringify(sourceMap)).toString('base64');
			comment = '\n//# sourceMappingURL=data:application/json;base64,' + base64Map;
		} else {
			var sourceMapFile = new gutil.File({
				cwd: file.cwd,
				base: file.base,
				path: file.path + '.map',
				contents: new Buffer(JSON.stringify(sourceMap))
			});
			this.push(sourceMapFile);

			comment = '\n//# sourceMappingURL=' + path.basename(file.path) + '.map';
		}

		file.contents = Buffer.concat([file.contents, new Buffer(comment)]);

		this.push(file);
		callback();
	}

	return through.obj(sourcemap);
};
