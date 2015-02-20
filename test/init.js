'use strict';

var test = require('tape');
var sourcemaps = require('..');
var File = require('vinyl');
var ReadableStream = require('stream').Readable;
var path = require('path');
var fs = require('fs');
var recordConsole = require('./consolerecorder.js');

var sourceContent = fs.readFileSync(path.join(__dirname, 'assets/helloworld.js')).toString();

function makeFile() {
    return new File({
        cwd: __dirname,
        base: path.join(__dirname, 'assets'),
        path: path.join(__dirname, 'assets', 'helloworld.js'),
        contents: new Buffer(sourceContent)
    });
}

function makeStreamFile() {
    return new File({
        cwd: __dirname,
        base: path.join(__dirname, 'assets'),
        path: path.join(__dirname, 'assets', 'helloworld.js'),
        contents: new ReadableStream()
    });
}

function makeFileWithInlineSourceMap() {
    return new File({
        cwd: __dirname,
        base: path.join(__dirname, 'assets'),
        path: path.join(__dirname, 'assets', 'all.js'),
        contents: new Buffer('console.log("line 1.1"),console.log("line 1.2"),console.log("line 2.1"),console.log("line 2.2");\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlcyI6WyJ0ZXN0MS5qcyIsInRlc3QyLmpzIl0sIm5hbWVzIjpbImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBQSxRQUFBQyxJQUFBLFlBQ0FELFFBQUFDLElBQUEsWUNEQUQsUUFBQUMsSUFBQSxZQUNBRCxRQUFBQyxJQUFBIiwic291cmNlc0NvbnRlbnQiOlsiY29uc29sZS5sb2coJ2xpbmUgMS4xJyk7XG5jb25zb2xlLmxvZygnbGluZSAxLjInKTtcbiIsImNvbnNvbGUubG9nKCdsaW5lIDIuMScpO1xuY29uc29sZS5sb2coJ2xpbmUgMi4yJyk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9')
    });
}

test('init: should pass through when file is null', function(t) {
    var file = new File();
    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.ok(!data.sourceMap, 'should not add a source map object');
            t.deepEqual(data, file, 'should not change file');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(file);
});

test('init: should emit an error if file content is a stream', function(t) {
    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            t.fail('should emit an error');
            t.end();
        })
        .on('error', function() {
            t.ok('should emit an error');
            t.end();
        })
        .write(makeStreamFile());
});

test('init: should add a valid source map', function(t) {
    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.equal(data.sourceMap.sources[0], 'helloworld.js', 'should add file to sources');
            t.equal(data.sourceMap.sourcesContent[0], sourceContent, 'should add file content to sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should add empty mappings');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(makeFile());
});

test('init: should import an existing inline source map', function(t) {
    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['test1.js', 'test2.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, ['console.log(\'line 1.1\');\nconsole.log(\'line 1.2\');\n', 'console.log(\'line 2.1\');\nconsole.log(\'line 2.2\');'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, 'AAAAA,QAAAC,IAAA,YACAD,QAAAC,IAAA,YCDAD,QAAAC,IAAA,YACAD,QAAAC,IAAA', 'should have right mappings');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(makeFileWithInlineSourceMap());
});

test('init: should remove inline sourcemap', function(t) {
    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
            t.end();
        })
        .write(makeFileWithInlineSourceMap());
});

test('init: should load external source map file referenced in comment with the \/\/# syntax', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld2.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should remove source map comment with the \/\/# syntax', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld2.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
            t.end();
        })
        .write(file);
});

test('init: should load external source map file referenced in comment with the \/*# *\/ syntax', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n/*# sourceMappingURL=helloworld2.js.map */');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should remove source map comment with the \/\/# syntax', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n/*# sourceMappingURL=helloworld2.js.map */');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
            t.end();
        })
        .write(file);
});

test('init: should load external source map if no source mapping comment', function(t) {
    var file = makeFile();
    file.path = file.path.replace('helloworld.js', 'helloworld2.js');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld2.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, ['source content from source map'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should load external source map and add sourceContent if missing', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld3.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld.js', 'test1.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, [file.contents.toString(), 'test1\n'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should not throw when source file for sourceContent not found', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld4.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld.js', 'missingfile'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, [file.contents.toString(), null], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should use unix style paths in sourcemap', function(t) {
    var file = makeFile();
    file.base = file.cwd;

    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            t.equal(data.sourceMap.file, 'assets/helloworld.js', 'should have right file');
            t.deepEqual(data.sourceMap.sources, ['assets/helloworld.js'], 'should have right sources');
            t.end();
        })
        .write(file);
});

test('init: should use sourceRoot when resolving path to sources', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld5.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['../helloworld.js', '../test1.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, [file.contents.toString(), 'test1\n'], 'should have right sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.equal(data.sourceMap.sourceRoot, 'test', 'should have right sourceRoot');
            t.end();
        })
        .write(file);
});

test('init: should not load source content if the path is a url', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld6.js.map');

    var pipeline = sourcemaps.init({loadMaps: true});
    pipeline
        .on('data', function(data) {
            t.ok(data.sourceMap, 'should add a source map object');
            t.equal(String(data.sourceMap.version), '3', 'should have version 3');
            t.deepEqual(data.sourceMap.sources, ['helloworld.js', 'http://example2.com/test1.js'], 'should have right sources');
            t.deepEqual(data.sourceMap.sourcesContent, [null, null]);
            t.equal(data.sourceMap.mappings, '', 'should have right mappings');
            t.end();
        })
        .write(file);
});

test('init: should output an error message if debug option is set and sourceContent is missing', function(t) {
    var file = makeFile();
    file.contents = new Buffer(sourceContent + '\n//# sourceMappingURL=helloworld4.js.map');

    var hConsole = recordConsole();
    var pipeline = sourcemaps.init({loadMaps: true, debug: true});
    pipeline
        .on('data', function(data) {
            hConsole.restore();
            t.equal(hConsole.history.log[0], 'gulp-sourcemap-init: No source content for "missingfile". Loading from file.', 'should log missing source content');
            t.ok(hConsole.history.warn[0].indexOf('gulp-sourcemap-init: source file not found: ') === 0, 'should warn about missing file');
            t.end();
        })
        .write(file);
});
