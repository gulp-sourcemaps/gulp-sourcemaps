'use strict';

var test = require('tape');
var utils = require('../src/utils');

test('exceptionToString: takes message if present', function(t) {
  var exception = { message: 'exception message' };
  var result = utils.exceptionToString(exception);

  t.equal(result, 'exception message');
  t.end();
});

test('exceptionToString: returns empty string if message is not present', function(t) {
  var exception = { foo: 'bar' };
  var result = utils.exceptionToString(exception);

  t.equal(result, '');
  t.end();
});

test('getCommentFormatter: gets a commenter with invalid extension', function(t) {
  var commenter = utils.getCommentFormatter({
    relative: 'some.junk',
    contents: "var a = 'hello';",
    sourceMap: { preExistingComment: true }
  });

  t.true(commenter);
  t.end();
});
