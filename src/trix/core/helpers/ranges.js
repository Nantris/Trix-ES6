/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/core/helpers/objects

let normalizeRange;
const {copyObject, objectsAreEqual} = Trix;

Trix.extend({
  normalizeRange: (normalizeRange = function(range) {
    if (range == null) { return; }
    if (!Array.isArray(range)) { range = [range, range]; }
    return [copyValue(range[0]), copyValue(range[1] != null ? range[1] : range[0])];
  }),

  rangeIsCollapsed(range) {
    if (range == null) { return; }
    const [start, end] = Array.from(normalizeRange(range));
    return rangeValuesAreEqual(start, end);
  },

  rangesAreEqual(leftRange, rightRange) {
    if ((leftRange == null) || (rightRange == null)) { return; }
    const [leftStart, leftEnd] = Array.from(normalizeRange(leftRange));
    const [rightStart, rightEnd] = Array.from(normalizeRange(rightRange));
    return rangeValuesAreEqual(leftStart, rightStart) &&
      rangeValuesAreEqual(leftEnd, rightEnd);
  }
});

var copyValue = function(value) {
  if (typeof value === "number") {
    return value;
  } else {
    return copyObject(value);
  }
};

var rangeValuesAreEqual = function(left, right) {
  if (typeof left === "number") {
    return left === right;
  } else {
    return objectsAreEqual(left, right);
  }
};
