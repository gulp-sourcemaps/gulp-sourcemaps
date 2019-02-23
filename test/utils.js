'use strict';

var expect = require('expect');
var utils = require('../src/utils');

describe('utils', function() {

  it('exceptionToString: takes message if present', function(done) {
    var exception = { message: 'exception message' };
    var result = utils.exceptionToString(exception);

    expect(result).toEqual('exception message');
    done();
  });

  it('exceptionToString: returns empty string if message is not present', function(done) {
    var exception = { foo: 'bar' };
    var result = utils.exceptionToString(exception);

    expect(result).toEqual('');
    done();
  });

  it('getCommentFormatter: gets a commenter with invalid extension', function(done) {
    var commenter = utils.getCommentFormatter({
      relative: 'some.junk',
      contents: "var a = 'hello';",
      sourceMap: { preExistingComment: true },
    });

    expect(commenter).toExist();
    done();
  });
});
