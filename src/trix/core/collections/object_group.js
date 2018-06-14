/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.ObjectGroup = class ObjectGroup {
  static groupObjects(ungroupedObjects, param) {
    let group;
    if (ungroupedObjects == null) { ungroupedObjects = []; }
    if (param == null) { param = {}; }
    let {depth, asTree} = param;
    if (asTree) { if (depth == null) { depth = 0; } }
    const objects = [];
    for (var object of Array.from(ungroupedObjects)) {
      if (group) {
        if ((typeof object.canBeGrouped === 'function' ? object.canBeGrouped(depth) : undefined) && __guardMethod__(group[group.length - 1], 'canBeGroupedWith', o => o.canBeGroupedWith(object, depth))) {
          group.push(object);
          continue;
        } else {
          objects.push(new (this)(group, {depth, asTree}));
          group = null;
        }
      }

      if ((typeof object.canBeGrouped === 'function' ? object.canBeGrouped(depth) : undefined)) {
        group = [object];
      } else {
        objects.push(object);
      }
    }

    if (group) {
      objects.push(new (this)(group, {depth, asTree}));
    }
    return objects;
  }

  constructor(objects, {depth, asTree}) {
    if (objects == null) { objects = []; }
    this.objects = objects;
    if (asTree) {
      this.depth = depth;
      this.objects = this.constructor.groupObjects(this.objects, {asTree, depth: this.depth + 1});
    }
  }

  getObjects() {
    return this.objects;
  }

  getDepth() {
    return this.depth;
  }

  getCacheKey() {
    const keys = ["objectGroup"];
    for (let object of Array.from(this.getObjects())) { keys.push(object.getCacheKey()); }
    return keys.join("/");
  }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}