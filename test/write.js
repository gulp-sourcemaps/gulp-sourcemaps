'use strict';

var test = require('tape');
var sourcemaps = require('..');
var File = require('vinyl');
var ReadableStream = require('stream').Readable;

function helloWorld() {
    console.log('Hello world!');
}

function makeSourceMap() {
    return {
        version: 3,
        file: 'test/helloworld.js',
        names: [],
        mappings: '',
        sources: [ 'test/helloworld.js' ],
        sourcesContent: [ helloWorld.toString() ]
    };
}

function base64JSON(object) {
    return 'data:application/json;base64,' + new Buffer(JSON.stringify(object)).toString('base64');
}

function makeFile() {
    var file = new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/helloworld.js',
        contents: new Buffer(helloWorld.toString())
    });
    file.sourceMap = makeSourceMap();
    return file;
}

function makeStreamFile() {
    var file = new File({
        cwd: '/',
        base: '/src/',
        path: '/src/test/helloworld.js',
        contents: new ReadableStream()
    });
    file.sourceMap = {};
    return file;
}


test('write: should pass through when file is null', function(t) {
    var file = new File();
    var pipeline = sourcemaps.write();
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.deepEqual(data, file, 'should not change file');
            t.equal(data.contents, null, 'should not change file content');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(file);
});

test('write: should pass through when file has no source map', function(t) {
    var file = makeFile();
    delete file.sourceMap;
    var pipeline = sourcemaps.write();
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.deepEqual(data, file, 'should not change file');
            t.equal(String(data.contents), helloWorld.toString(), 'should not change file content');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(file);
});

test('write: should emit an error if file content is a stream', function(t) {
    var pipeline = sourcemaps.write();
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

test('write: should write an inline souce map', function(t) {
    var file = makeFile();
    var pipeline = sourcemaps.write();
    pipeline
        .on('data', function(data) {
            t.ok(data, 'should pass something through');
            t.ok(data instanceof File, 'should pass a vinyl file through');
            t.deepEqual(data, file, 'should not change file');
            t.equal(String(data.contents),
                helloWorld.toString() + '\n//# sourceMappingURL=' + base64JSON(data.sourceMap),
                'should add source map as comment');
            t.end();
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(file);
});

test('write: should use CSS comments if CSS file', function(t) {
    var file = makeFile();
    file.path = file.path.replace('.js', '.css');
    var pipeline = sourcemaps.write();
    pipeline
        .on('data', function(data) {
            t.equal(String(data.contents),
                helloWorld.toString() + '\n/*# sourceMappingURL=' + base64JSON(data.sourceMap) + ' */',
                'should add source map with CSS comment');
            t.end();
        })
        .write(file);
});

test('write: should write external map files', function(t) {
    var file = makeFile();
    var pipeline = sourcemaps.write('../maps');
    var fileCount = 0;
    var outFiles = [];
    var sourceMap;
    pipeline
        .on('data', function(data) {
            outFiles.push(data);
            fileCount++;
            if (fileCount == 2) {
                outFiles.reverse().map(function(data) {
                    if (data.path === '/src/test/helloworld.js') {
                        sourceMap = data.sourceMap;
                        t.ok(data instanceof File, 'should pass a vinyl file through');
                        t.deepEqual(data, file, 'should not change file');
                        t.equal(String(data.contents),
                            helloWorld.toString() + '\n//# sourceMappingURL=../../maps/test/helloworld.js.map',
                            'should add a comment referencing the source map file');
                    } else {
                        t.ok(data instanceof File, 'should pass a vinyl file through');
                        t.equal(data.path, '/maps/test/helloworld.js.map');
                        t.deepEqual(JSON.parse(data.contents), sourceMap, 'should have the file\'s source map as content');
                    }
                });
                t.end();
            }
        })
        .on('error', function() {
            t.fail('emitted error');
            t.end();
        })
        .write(file);
});

test('write: should write no comment with option addComment=false', function(t) {
    var file = makeFile();
    var pipeline = sourcemaps.write({addComment: false});
    pipeline
        .on('data', function(data) {
            t.equal(String(data.contents), helloWorld.toString(), 'should not change file content');
            t.end();
        })
        .write(file);
});

test('write: should not include source content with option includeContent=false', function(t) {
    var file = makeFile();
    var pipeline = sourcemaps.write({includeContent: false});
    pipeline
        .on('data', function(data) {
            t.equal(data.sourceMap.sourcesContent, undefined, 'should not have source content');
            t.end();
        })
        .write(file);
});

test('write: should set the sourceRoot by option sourceRoot', function(t) {
    var file = makeFile();
    var pipeline = sourcemaps.write({sourceRoot: '/testSourceRoot'});
    pipeline
        .on('data', function(data) {
            t.equal(data.sourceMap.sourceRoot, '/testSourceRoot', 'should set sourceRoot');
            t.end();
        })
        .write(file);
});