/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
if (window.Set == null) { let Set;
window.Set = (Set = class Set {
  constructor() {
    this.clear();
  }

  clear() {
    return this.values = [];
  }

  has(value) {
    return this.values.indexOf(value) !== -1;
  }

  add(value) {
    if (!this.has(value)) {
      this.values.push(value);
    }
    return this;
  }

  delete(value) {
    let index;
    if ((index = this.values.indexOf(value)) === -1) {
      return false;
    } else {
      this.values.splice(index, 1);
      return true;
    }
  }

  forEach() {
    return this.values.forEach(...arguments);
  }
}); }
