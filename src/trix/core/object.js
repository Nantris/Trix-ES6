/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/core/basic_object

(function() {
  let id = undefined;
  const Cls = (Trix.Object = class Object extends Trix.BasicObject {
    static initClass() {
      id = 0;
    }

    static fromJSONString(jsonString) {
      return this.fromJSON(JSON.parse(jsonString));
    }

    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.id = ++id;
    }

    hasSameConstructorAs(object) {
      return this.constructor === (object != null ? object.constructor : undefined);
    }

    isEqualTo(object) {
      return this === object;
    }

    inspect() {
      const contents = (() => {
        let left;
        const result = [];
        const object = (left = this.contentsForInspection()) != null ? left : {};
        for (let key in object) {
          const value = object[key];
          result.push(`${key}=${value}`);
        }
        return result;
      })();

      return `#<${this.constructor.name}:${this.id}${contents.length ? ` ${contents.join(", ")}` : ""}>`;
    }

    contentsForInspection() {}

    toJSONString() {
      return JSON.stringify(this);
    }

    toUTF16String() {
      return Trix.UTF16String.box(this);
    }

    getCacheKey() {
      return this.id.toString();
    }
  });
  Cls.initClass();
  return Cls;
})();
