/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.extend({
  copyObject(object) {
    if (object == null) { object = {}; }
    const result = {};
    for (let key in object) { const value = object[key]; result[key] = value; }
    return result;
  },

  objectsAreEqual(a, b) {
    if (a == null) { a = {}; }
    if (b == null) { b = {}; }
    if (Object.keys(a).length !== Object.keys(b).length) { return false; }
    for (let key in a) {
      const value = a[key];
      if (value !== b[key]) { return false; }
    }
    return true;
  }
});
