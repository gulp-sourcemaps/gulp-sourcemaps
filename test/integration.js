'use strict';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var test = require('tape');
var sourcemaps = require('..');
var yargs = require('yargs').argv;
var debug = require('debug-fabulous')();
if (!yargs.ignoreLogTests){
  debug.save('gulp-sourcemaps:*');
  debug.enable(debug.load());
}
var join = require('path').join;
var fs = require('fs');
var sourceContent = fs.readFileSync(join(__dirname, 'assets/helloworld.js')).toString();
var _ = require('lodash');


function base64JSON(object) {
  return 'data:application/json;charset=utf8;base64,' + new Buffer(JSON.stringify(object)).toString('base64');
}

function moveHtml(dest, t){
  return gulp.src(join(__dirname, './assets/*.html'))
  .pipe(gulp.dest('tmp/' + dest))
  .on('finish', t.end);
}

debug('running');

test('combined: creates inline mapping', function(t) {

  gulp.src(join(__dirname, './assets/helloworld.js'))
  .pipe(sourcemaps.init())
  .pipe(sourcemaps.write())
  // .pipe(gulp.dest('tmp'))
  .on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.deepEqual(
      data.contents.toString(),
      sourceContent + '\n//# sourceMappingURL=' + base64JSON(data.sourceMap) + '\n',
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

test('combined: creates preExistingComment , no new previous line', function(t) {
  gulp.src(join(__dirname, './assets/helloworld.map.js'))
  .pipe(sourcemaps.init({loadMaps:true}))
  .pipe(sourcemaps.write())
  // .pipe(gulp.dest('tmp'))
  .on('data', function(data) {
    t.ok(data.sourceMap, 'should add a source map object');
    t.ok(!!data.sourceMap.preExistingComment, 'should know the sourcemap pre-existed');
    t.deepEqual(
      data.contents.toString(),
      sourceContent + '\n//# sourceMappingURL=' + base64JSON(data.sourceMap) + '\n',
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

test('combined: less: inline concatenated file', {timeout: 6000}, function(t) { //note ~1000 ms is fine locally, travis needs more
  // note: on travis node 0.12 seems to have the brunt of the slowness
  
  // proves that gulp-less compilation is not slow
  // https://github.com/floridoo/gulp-sourcemaps/issues/215

  gulp.src(join(__dirname, './assets/*.less'))
  .pipe(sourcemaps.init())
  .pipe($.if("*.less",$.less()))
  .pipe(sourcemaps.write({sourceRoot:'../../test/assets'}))
  .pipe(gulp.dest('tmp/combined_inline_less'))
  .once('error', function() {
    t.fail('emitted error');
    t.end();
  })
  .once('finish', function(){
    moveHtml('combined_inline_less', t);
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
  .once('error', function() {
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
  .once('finish', function(){
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


// - thanks @twiggy https://github.com/floridoo/gulp-sourcemaps/issues/270#issuecomment-271723208
test('sources: is valid with concat', function(t) {

  gulp.src([
    join(__dirname, './assets/test3.js'),
    join(__dirname, './assets/test4.js'),
  ])
  .pipe(sourcemaps.init())
  .pipe($.concat("index.js"))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('tmp/sources_concat'))
  .on('data', function(file) {
    if (!/.*\.map/.test(file.path)) return;

    var contents = JSON.parse(file.contents.toString());
    _.each(contents.sources, function(s, i){
      t.deepEqual(s, "test" + (i+3) + ".js", "source is correct, test" + (i+3) + ".js");
    });
  })
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  }).on('finish', function(){
    moveHtml('sources_concat', t);
  });

});

// - thanks @twiggy https://github.com/floridoo/gulp-sourcemaps/issues/270#issuecomment-271723208
test('sources: mapSourcesAbsolute: is valid with concat', function(t) {

  gulp.src([
    join(__dirname, './assets/test3.js'),
    join(__dirname, './assets/test4.js'),
  ])
  .pipe(sourcemaps.init())
  .pipe($.concat("index.js"))
  .pipe(sourcemaps.write('.', {mapSourcesAbsolute:true}))
  .pipe(gulp.dest('tmp/sources_concat'))
  .on('data', function(file) {
    if (!/.*\.map/.test(file.path)) return;

    var contents = JSON.parse(file.contents.toString());
    _.each(contents.sources, function(s, i){
      t.deepEqual(s, "/test/assets/test" + (i+3) + ".js", "source is correct, test" + (i+3) + ".js");
    });
  })
  .on('error', function() {
    t.fail('emitted error');
    t.end();
  }).on('finish', function(){
    moveHtml('sources_concat', t);
  });

});
