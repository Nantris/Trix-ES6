/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require_self
//= require_tree ./fixtures
//= require_tree .

// Remove QUnit's globals
let helpers, value;
for (var key in QUnit) { value = QUnit[key]; if (window[key] === value) { delete window[key]; } }

Trix.TestHelpers = (helpers = {
  extend(properties) {
    for (key in properties) {
      value = properties[key];
      this[key] = value;
    }
    return this;
  },

  after(delay, callback) {
    return setTimeout(callback, delay);
  },

  defer(callback) {
    return helpers.after(1, callback);
  }
});
