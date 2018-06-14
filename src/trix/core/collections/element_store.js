/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
(function() {
  let getKey = undefined;
  const Cls = (Trix.ElementStore = class ElementStore {
    static initClass() {
  
      getKey = element => element.dataset.trixStoreKey;
    }
    constructor(elements) {
      this.reset(elements);
    }

    add(element) {
      const key = getKey(element);
      return this.elements[key] = element;
    }

    remove(element) {
      let value;
      const key = getKey(element);
      if (value = this.elements[key]) {
        delete this.elements[key];
        return value;
      }
    }

    reset(elements) {
      if (elements == null) { elements = []; }
      this.elements = {};
      for (let element of Array.from(elements)) { this.add(element); }
      return elements;
    }
  });
  Cls.initClass();
  return Cls;
})();
