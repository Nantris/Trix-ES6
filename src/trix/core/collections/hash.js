/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {arraysAreEqual} = Trix;

(function() {
  let object = undefined;
  let merge = undefined;
  let copy = undefined;
  let box = undefined;
  let unbox = undefined;
  const Cls = (Trix.Hash = class Hash extends Trix.Object {
    static initClass() {
  
      object = function(key, value) {
        const result = {};
        result[key] = value;
        return result;
      };
  
      merge = function(object, values) {
        const result = copy(object);
        for (let key in values) {
          const value = values[key];
          result[key] = value;
        }
        return result;
      };
  
      copy = function(object, keyToRemove) {
        const result = {};
        const sortedKeys = Object.keys(object).sort();
        for (let key of Array.from(sortedKeys)) {
          if (key !== keyToRemove) {
            result[key] = object[key];
          }
        }
        return result;
      };
  
      box = function(object) {
        if (object instanceof Trix.Hash) {
          return object;
        } else {
          return new Trix.Hash(object);
        }
      };
  
      unbox = function(object) {
        if (object instanceof Trix.Hash) {
          return object.values;
        } else {
          return object;
        }
      };
    }
    static fromCommonAttributesOfObjects(objects) {
      if (objects == null) { objects = []; }
      if (!objects.length) { return new (this); }
      let hash = box(objects[0]);
      let keys = hash.getKeys();

      for (object of Array.from(objects.slice(1))) {
        keys = hash.getKeysCommonToHash(box(object));
        hash = hash.slice(keys);
      }
      return hash;
    }

    static box(values) {
      return box(values);
    }

    constructor(values) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      if (values == null) { values = {}; }
      this.values = copy(values);
      super(...arguments);
    }

    add(key, value) {
      return this.merge(object(key, value));
    }

    remove(key) {
      return new Trix.Hash(copy(this.values, key));
    }

    get(key) {
      return this.values[key];
    }

    has(key) {
      return key in this.values;
    }

    merge(values) {
      return new Trix.Hash(merge(this.values, unbox(values)));
    }

    slice(keys) {
      const values = {};
      for (let key of Array.from(keys)) { if (this.has(key)) { values[key] = this.values[key]; } }
      return new Trix.Hash(values);
    }

    getKeys() {
      return Object.keys(this.values);
    }

    getKeysCommonToHash(hash) {
      hash = box(hash);
      return Array.from(this.getKeys()).filter((key) => this.values[key] === hash.values[key]);
    }

    isEqualTo(values) {
      return arraysAreEqual(this.toArray(), box(values).toArray());
    }

    isEmpty() {
      return this.getKeys().length === 0;
    }

    toArray() {
      let result;
      return (this.array != null ? this.array : (this.array = (
        (result = []),
        (() => {
          const result1 = [];
          for (let key in this.values) {
            const value = this.values[key];
            result1.push(result.push(key, value));
          }
          return result1;
        })(),
        result
      ))).slice(0);
    }

    toObject() {
      return copy(this.values);
    }

    toJSON() {
      return this.toObject();
    }

    contentsForInspection() {
      return {values: JSON.stringify(this.values)};
    }
  });
  Cls.initClass();
  return Cls;
})();
