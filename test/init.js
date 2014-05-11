'use strict';

var test = require('tape');
var sourcemaps = require('..');
var File = require('vinyl');
var ReadableStream = require('stream').Readable;

function helloWorld() {
    console.log('Hello world!');
}

function makeFile() {
    return new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/helloworld.js',
        contents: new Buffer(helloWorld.toString())
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
            t.equal(data.sourceMap.sourcesContent[0], 'function helloWorld() {\n    console.log(\'Hello world!\');\n}', 'should add file content to sourcesContent');
            t.equal(data.sourceMap.mappings, '', 'should add empty mappings');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(makeFile());
});
