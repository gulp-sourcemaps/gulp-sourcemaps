'use strict';

var expect = require('expect');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var sourcemaps = require('..');
var debug = require('debug-fabulous')();
var miss = require('mississippi');
var rimraf = require('rimraf');

var pipe = miss.pipe;
var concat = miss.concat;

var ignoreLogTests = process.argv.indexOf('--ignore-log-tests') !== -1;

if (!ignoreLogTests) {
  debug.save('gulp-sourcemaps:*');
  debug.enable(debug.load());
}
var join = require('path').join;
var fs = require('fs');
var sourceContent = fs.readFileSync(join(__dirname, 'assets/helloworld.js')).toString();

function base64JSON(object) {
  return 'data:application/json;charset=utf8;base64,' + Buffer.from(JSON.stringify(object)).toString('base64');
}

debug('running');

describe('integrations', function() {

  after(function(cb) {
    rimraf('./tmp', cb);
  });

  it('combined: creates inline mapping', function(done) {

    function assert(results) {
      var data = results[0];
      expect(data.sourceMap).toExist();
      expect(data.contents.toString()).toEqual(sourceContent + '\n//# sourceMappingURL=' + base64JSON(data.sourceMap) + '\n');
    }

    pipe([
      gulp.src('assets/helloworld.js', { cwd: __dirname }),
      sourcemaps.init(),
      sourcemaps.write(),
      concat(assert),
    ], done);
  });

  it('combined: creates preExistingComment , no new previous line', function(done) {

    function assert(results) {
      var data = results[0];
      expect(data.sourceMap).toExist();
      expect(data.sourceMap.preExistingComment).toExist();
      expect(data.contents.toString()).toEqual(sourceContent + '\n//# sourceMappingURL=' + base64JSON(data.sourceMap) + '\n');
    }

    pipe([
      gulp.src('assets/helloworld.map.js', { cwd: __dirname }),
      sourcemaps.init({ loadMaps: true }),
      sourcemaps.write(),
      concat(assert),
    ], done);
  });


  it('combined mapped: concat files with final combined sourcemap file', function(done) {

    function assert(results) {
      var data = results[1];
      // TODO: This might be flakey since it grabs index 1 from results
      expect(/index\.js$/.test(data.path)).toEqual(true);
      expect(/\/\/# sourceMappingURL=index.js.map/.test(data.contents.toString())).toEqual(true);
      expect(data.contents.toString().match(/\/\/# sourceMappingURL/g).length).toEqual(1);
    }

    pipe([
      gulp.src(['assets/*.js', '!assets/test*.js', '!assets/*map.js'], { cwd: __dirname }),
      sourcemaps.init(),
      $.if('*.js', $.concat('index.js')),
      sourcemaps.write('.', { sourceRoot: '../../test/assets' }),
      concat(assert),
    ], done);
  });

  it('combined: inline concatenated file', function(done) {

    function assert(results) {
      var data = results[0];
      expect(/index\.js$/.test(data.path)).toEqual(true);
      expect(/\/\/# sourceMappingURL=data:application.*/.test(data.contents.toString())).toEqual(true);
      expect(data.contents.toString().match(/\/\/# sourceMappingURL/g).length).toEqual(1);
    }

    pipe([
      gulp.src(['assets/*.js', '!assets/test*.js', '!assets/*map.js'], { cwd: __dirname }),
      sourcemaps.init(),
      $.if('*.js', $.concat('index.js')),
      sourcemaps.write({ sourceRoot: '../../test/assets' }),
      concat(assert),
    ], done);
  });

  it('combined: less: inline concatenated file', function(done) {
    // note ~1000 ms is fine locally, travis needs more
    // note: on travis node 0.12 seems to have the brunt of the slowness
    this.timeout(6000);

    // proves that gulp-less compilation is not slow
    // https://github.com/gulp-sourcemaps/gulp-sourcemaps/issues/215

    pipe([
      gulp.src('assets/*.less', { cwd: __dirname }),
      sourcemaps.init(),
      $.if('*.less', $.less()),
      sourcemaps.write({ sourceRoot: '../../test/assets' }),
      concat(),
    ], done);
  });

  it('combined: mapped preExisting', function(done) {

    function assert(results) {
      var data = results[1];
      // TODO: This might be flakey since it grabs index 1 from results
      expect(/index\.js$/.test(data.path)).toEqual(true);
      expect(/\/\/# sourceMappingURL=index.js.map/.test(data.contents.toString())).toEqual(true);
      expect(data.contents.toString().match(/\/\/# sourceMappingURL/g).length).toEqual(1);
    }

    pipe([
      // picking a file with no existing sourcemap, if we use helloworld2 it will attempt to use helloworld2.js.map
      gulp.src([
        'assets/helloworld7.js', // NO PRE-MAP at all
        'assets/helloworld.map.js', // INLINE PRE-MAp
      ], { cwd: __dirname }),
      sourcemaps.init({ loadMaps: true }),
      $.if('*.js', $.concat('index.js')),
      sourcemaps.write('.', { sourceRoot: '../../test/assets' }),
      concat(assert),
    ], done);
  });


  it('combined: inlined preExisting', function(done) {

    function assert(results) {
      var data = results[0];
      expect(/index\.js$/.test(data.path)).toEqual(true);
      expect(/\/\/# sourceMappingURL=data:application.*/.test(data.contents.toString())).toEqual(true);
      expect(data.contents.toString().match(/\/\/# sourceMappingURL/g).length).toEqual(1);
    }

    pipe([
      // picking a file with no existing sourcemap, if we use helloworld2 it will attempt to use helloworld2.js.map
      gulp.src([
        'assets/helloworld7.js', // NO PRE-MAP at all
        'assets/helloworld.map.js', // INLINE PRE-MAp
      ], { cwd: __dirname }),
      sourcemaps.init({ loadMaps: true }),
      $.if('*.js', $.concat('index.js')),
      sourcemaps.write({ sourceRoot: '../../test/assets' }),
      concat(assert),
    ], done);
  });

  it('combined: mapped preExisting with two tasks', function(done) {

    function assert(results) {
      var data = results[1];
      // TODO: This might be flakey since it grabs index 1 from results
      expect(/index\.js$/.test(data.path)).toEqual(true);
      expect(/\/\/# sourceMappingURL=index.js.map/.test(data.contents.toString())).toEqual(true);
      expect(data.contents.toString().match(/\/\/# sourceMappingURL/g).length).toEqual(1);
    }

    pipe([
      gulp.src('assets/helloworld7.js', { cwd: __dirname }),
      sourcemaps.init(),
      $.if('*.js', $.concat('h7.js')),
      sourcemaps.write('.'),
      gulp.dest('tmp/combined_map_preExisting_two_task/tmp'),
    ], function(err) {
      if (err) {
        done(err);
        return;
      }

      pipe([
        gulp.src(['../tmp/combined_map_preExisting_two_task/tmp/h7.js', 'assets/helloworld.map.js'], { cwd: __dirname }),
        sourcemaps.init({ loadMaps: true }),
        $.if('*.js', $.concat('index.js')),
        sourcemaps.write('.', { sourceRoot: '../../test/assets' }),
        concat(assert),
      ], done);
    });
  });


  // - thanks @twiggy https://github.com/gulp-sourcemaps/gulp-sourcemaps/issues/270#issuecomment-271723208
  it('sources: is valid with concat', function(done) {

    function assert(results) {
      var data = results[0];
      // TODO: This might be flakey since it grabs index 0 from results
      expect(/.*\.map/.test(data.path)).toEqual(true);

      var contents = JSON.parse(data.contents.toString());
      contents.sources.forEach(function(s, i) {
        expect(s).toEqual('test' + (i + 3) + '.js');
      });
    }

    pipe([
      gulp.src(['assets/test3.js', 'assets/test4.js'], { cwd: __dirname }),
      sourcemaps.init(),
      $.concat('index.js'),
      sourcemaps.write('.'),
      concat(assert),
    ], done);
  });

  // - thanks @twiggy https://github.com/gulp-sourcemaps/gulp-sourcemaps/issues/270#issuecomment-271723208
  it('sources: mapSourcesAbsolute: is valid with concat', function(done) {

    function assert(results) {
      var data = results[0];
      // TODO: This might be flakey since it grabs index 0 from results
      expect(/.*\.map/.test(data.path)).toEqual(true);

      var contents = JSON.parse(data.contents.toString());
      contents.sources.forEach(function(s, i) {
        expect(s).toEqual('/test/assets/test' + (i + 3) + '.js');
      });
    }

    pipe([
      // This changed to `test/assets/` because join isn't valid globs
      gulp.src(['test/assets/test3.js', 'test/assets/test4.js']),
      sourcemaps.init(),
      $.concat('index.js'),
      sourcemaps.write('.', { mapSourcesAbsolute: true }),
      concat(assert),
    ], done);
  });
});
