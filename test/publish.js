'use strict';

var test = require('tape');
var exec = require('child_process').exec;

function cleanUp(cb) {
  return exec('rm -rf ./tmp', cb);
}

function makeTestPackage(cb) {
  return exec('./scripts/mockPublish', cb);
}

// with regards to averting npm publishing disasters https://github.com/floridoo/gulp-sourcemaps/issues/246
test('publish: can load a published version', function(t) {
  // return t.fail("mock fail");
  cleanUp(function() {
    makeTestPackage(function() {
      try {
        // attempt to load a packed / unpacked potential deployed version
        require('../tmp/package/index');
      } catch (error) {
        t.fail(error);
      } finally {
        cleanUp(function() {
          t.end();
        });
      }
    });
  });
});
