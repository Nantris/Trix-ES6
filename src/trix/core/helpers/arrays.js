/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.extend({
  arraysAreEqual(a, b) {
    if (a == null) { a = []; }
    if (b == null) { b = []; }
    if (a.length !== b.length) { return false; }
    for (let index = 0; index < a.length; index++) {
      const value = a[index];
      if (value !== b[index]) { return false; }
    }
    return true;
  },

  arrayStartsWith(a, b) {
    if (a == null) { a = []; }
    if (b == null) { b = []; }
    return Trix.arraysAreEqual(a.slice(0, b.length), b);
  },

  spliceArray(array, ...args) {
    const result = array.slice(0);
    result.splice(...Array.from(args || []));
    return result;
  },

  summarizeArrayChange(oldArray, newArray) {
    if (oldArray == null) { oldArray = []; }
    if (newArray == null) { newArray = []; }
    const added = [];
    const removed = [];

    const existingValues = new Set;
    for (var value of Array.from(oldArray)) {
      existingValues.add(value);
    }

    const currentValues = new Set;
    for (value of Array.from(newArray)) {
      currentValues.add(value);
      if (!existingValues.has(value)) {
        added.push(value);
      }
    }

    for (value of Array.from(oldArray)) {
      if (!currentValues.has(value)) {
        removed.push(value);
      }
    }

    return {added, removed};
  }});
