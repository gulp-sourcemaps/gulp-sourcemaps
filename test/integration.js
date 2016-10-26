'use strict';
var gulp = require('gulp');
var test = require('tape');
var $ = require('..');
var PLUGIN_NAME = require('../src/utils').PLUGIN_NAME;
var debug = require('debug-fabulous')()(PLUGIN_NAME + ':test:integration');
var join = require('path').join;
var fs = require('fs');
var sourceContent = fs.readFileSync(join(__dirname, 'assets/helloworld.js')).toString();

debug('running');

test('creates inline mapping', function(t) {

  gulp.src(join(__dirname, './assets/helloworld.js'))
  .pipe($.init())
  .pipe($.write())
  // .pipe(gulp.dest('tmp'))
  .on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.deepEqual(
      data.contents.toString(),
      sourceContent + "\n//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJoZWxsb3dvcmxkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaGVsbG9Xb3JsZCgpIHtcbiAgICBjb25zb2xlLmxvZygnSGVsbG8gd29ybGQhJyk7XG59XG4iXSwiZmlsZSI6ImhlbGxvd29ybGQuanMifQ==\n",
      'file should be sourcemapped'
    );
    t.end();
  })
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('close', function() {
    t.end();
  });
});

test('creates re-uses existing mapping', function(t) {
  gulp.src(join(__dirname, './assets/helloworld.map.js'))
  .pipe($.init({loadMaps:true}))
  .pipe($.write())
  // .pipe(gulp.dest('tmp'))
  .on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.ok(!!data.sourceMap.preExisting, 'should know the sourcemap pre-existed');
    t.deepEqual(
      data.contents.toString(),
      sourceContent + "\n//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJoZWxsb3dvcmxkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaGVsbG9Xb3JsZCgpIHtcbiAgICBjb25zb2xlLmxvZygnSGVsbG8gd29ybGQhJyk7XG59XG4iXSwiZmlsZSI6ImhlbGxvd29ybGQuanMifQ==",
      'file should be sourcemapped'
    );
    t.end();
  })
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('close', function() {
    t.end();
  });
});
