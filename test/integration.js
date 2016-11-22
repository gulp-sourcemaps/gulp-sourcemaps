'use strict';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var test = require('tape');
var sourcemaps = require('..');
var PLUGIN_NAME = require('../src/utils').PLUGIN_NAME;
var debug = require('debug-fabulous')()(PLUGIN_NAME + ':test:integration');
var join = require('path').join;
var fs = require('fs');
var sourceContent = fs.readFileSync(join(__dirname, 'assets/helloworld.js')).toString();


function moveHtml(dest, t){
  return gulp.src(join(__dirname, './assets/*.html'))
  .pipe(gulp.dest('tmp/' + dest))
  .on('finish', t.end);
}

debug('running');

test('creates inline mapping', function(t) {

  gulp.src(join(__dirname, './assets/helloworld.js'))
  .pipe(sourcemaps.init())
  .pipe(sourcemaps.write())
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
  .pipe(sourcemaps.init({loadMaps:true}))
  .pipe(sourcemaps.write())
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


test('combined mapped: concat files with final combined sourcemap file', function(t) {

  gulp.src([
    join(__dirname, './assets/*.js'),
    '!' + join(__dirname, './assets/test*.js'),
    '!' + join(__dirname, './assets/*map.js')]
  )
  .pipe(sourcemaps.init())
  .pipe($.if("*.js",$.concat("index.js")))
  .pipe(sourcemaps.write('.',{sourceRoot:'../../test/assets'}))
  .pipe(gulp.dest('tmp/combined_map'))
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('data', function(data){
    if(/index\.js$/.test(data.path)){
      t.ok(/\/\/# sourceMappingURL=index.js.map/.test(data.contents.toString()),
        'concatenated file is mapped');
      t.equal(data.contents.toString().match(/\/\/# sourceMappingURL/g).length, 1,
        'concatenated file is mapped once');
    }
  })
  .on('finish', function(){
    moveHtml('combined_map', t);
  });
});

test('combined: inline concatenated file', function(t) {

  gulp.src([
    join(__dirname, './assets/*.js'),
    '!' + join(__dirname, './assets/test*.js'),
    '!' + join(__dirname, './assets/*map.js')]
  )
  .pipe(sourcemaps.init())
  .pipe($.if("*.js",$.concat("index.js")))
  .pipe(sourcemaps.write({sourceRoot:'../../test/assets'}))
  .pipe(gulp.dest('tmp/combined_inline'))
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('data', function(data){
    if(/index\.js$/.test(data.path)){
      t.ok(/\/\/# sourceMappingURL=data:application.*/.test(data.contents.toString()),
        'concatenated file is mapped');
      t.equal(data.contents.toString().match(/\/\/# sourceMappingURL/g).length, 1,
        'concatenated file is mapped once');
    }
  })
  .on('finish', function(){
    moveHtml('combined_inline', t);
  });
});

test('combined: mapped preExisting', function(t) {

  gulp.src([
    //picking a file with no existing sourcemap, if we use helloworld2 it will attempt to use helloworld2.js.map
    join(__dirname, './assets/helloworld7.js'), //NO PRE-MAP at all
    join(__dirname, './assets/helloworld.map.js') //INLINE PRE-MAp
    ]
  )
  .pipe(sourcemaps.init({loadMaps:true}))
  .pipe($.if("*.js",$.concat("index.js")))
  .pipe(sourcemaps.write('.', {sourceRoot:'../../test/assets'}))
  .pipe(gulp.dest('tmp/combined_map_preExisting'))
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('data', function(data){
    if(/index\.js$/.test(data.path)){
      t.ok(/\/\/# sourceMappingURL=index.js.map/.test(data.contents.toString()),
        'concatenated file is mapped');
      t.equal(data.contents.toString().match(/\/\/# sourceMappingURL/g).length, 1,
        'concatenated file is mapped once');
    }
  })
  .on('finish', function(){
    moveHtml('combined_map_preExisting', t);
  });
});


test('combined: inlined preExisting', function(t) {

  gulp.src([
    //picking a file with no existing sourcemap, if we use helloworld2 it will attempt to use helloworld2.js.map
    join(__dirname, './assets/helloworld7.js'), //NO PRE-MAP at all
    join(__dirname, './assets/helloworld.map.js') //INLINE PRE-MAp
    ]
  )
  .pipe(sourcemaps.init({loadMaps:true}))
  .pipe($.if("*.js",$.concat("index.js")))
  .pipe(sourcemaps.write({sourceRoot:'../../test/assets'}))
  .pipe(gulp.dest('tmp/combined_inline_preExisting'))
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('data', function(data){
    if(/index\.js$/.test(data.path)){
      t.ok(/\/\/# sourceMappingURL=data:application.*/.test(data.contents.toString()),
        'concatenated file is mapped');
      t.equal(data.contents.toString().match(/\/\/# sourceMappingURL/g).length, 1,
        'concatenated file is mapped once');
    }
  })
  .on('finish', function(){
    moveHtml('combined_inline_preExisting', t);
  });
});


test('combined: mapped preExisting with two tasks', function(t) {

  gulp.src(join(__dirname, './assets/helloworld7.js'))
  .pipe(sourcemaps.init())
  .pipe($.if("*.js",$.concat("h7.js")))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('tmp/combined_map_preExisting_two_task/tmp'))
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .on('finish', function(){
    gulp.src([
      './tmp/combined_map_preExisting_two_task/tmp/h7.js',
      join(__dirname, './assets/helloworld.map.js')])
    .pipe(sourcemaps.init({loadMaps:true}))
    .pipe($.if("*.js",$.concat("index.js")))
    .pipe(sourcemaps.write('.', {sourceRoot: '../../test/assets'}))
    .pipe(gulp.dest('tmp/combined_map_preExisting_two_task'))
    .on('finish', function(){
      moveHtml('combined_map_preExisting_two_task', t);
    });
  });
});
