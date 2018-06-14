/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.ObjectMap = class ObjectMap extends Trix.BasicObject {
  constructor(objects) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    if (objects == null) { objects = []; }
    this.objects = {};
    for (let object of Array.from(objects)) {
      const hash = JSON.stringify(object);
      if (this.objects[hash] == null) { this.objects[hash] = object; }
    }
  }

  find(object) {
    const hash = JSON.stringify(object);
    return this.objects[hash];
  }
};
