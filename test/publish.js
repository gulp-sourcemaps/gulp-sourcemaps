'use strict';

var exec = require('child_process').exec;

function cleanUp(cb) {
  return exec('rm -rf ./tmp', cb);
}

function makeTestPackage(cb) {
  return exec('./scripts/mockPublish', cb);
}


describe('mock publish', function() {

  beforeEach(makeTestPackage);
  afterEach(cleanUp);

  // with regards to averting npm publishing disasters https://github.com/floridoo/gulp-sourcemaps/issues/246
  it('can load a published version', function(done) {
    try {
      // attempt to load a packed / unpacked potential deployed version
      require('../tmp/package/index');
    } catch (error) {
      done(error);
      return;
    }

    done();
  });
});
