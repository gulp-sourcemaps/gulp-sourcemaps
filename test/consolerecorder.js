'use strict';
module.exports = function recordConsole() {
    var functions = ['log', 'warn', 'error'];
    var originals = {};
    var history = {};
    functions.forEach(function(func) {
        originals[func] = console[func];
        history[func] = [];
        console[func] = function(msg) {
            history[func].push(msg);
        };
    });
    return {
        history: history,
        restore: function() {
            functions.forEach(function(func) {
                console[func] = originals[func];
            });
        }
    };
};
