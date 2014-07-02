'use strict';

var test = require('tape');
var sourcemaps = require('..');
var File = require('vinyl');
var ReadableStream = require('stream').Readable;
var path = require('path');
var fs = require('fs');

var sourceContent = fs.readFileSync(path.join(__dirname, 'assets/helloworld.js')).toString();

function makeFile() {
    return new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/helloworld.js',
        contents: new Buffer(sourceContent)
    });
}

function makeStreamFile() {
    return new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/helloworld.js',
        contents: new ReadableStream()
    });
}

function makeFileWithInlineSourceMap() {
    return new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/all.js',
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
            t.equal(data.sourceMap.sources[0], 'test/helloworld.js', 'should add file to sources');
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
    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            console.log(data.sourceMap);
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

test('should remove inline sourcemap', function(t) {
    var pipeline = sourcemaps.init();
    pipeline
        .on('data', function(data) {
            t.notOk(/sourceMappingURL/.test(data.contents.toString()), 'should not have sourcemapping');
            t.end();
        })
        .write(makeFileWithInlineSourceMap());
});
