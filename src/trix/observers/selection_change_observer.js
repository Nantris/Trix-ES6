/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {getDOMRange} = Trix;

(function() {
  let domRangesAreEqual = undefined;
  const Cls = (Trix.SelectionChangeObserver = class SelectionChangeObserver extends Trix.BasicObject {
    static initClass() {
  
      domRangesAreEqual = (left, right) =>
        ((left != null ? left.startContainer : undefined) === (right != null ? right.startContainer : undefined)) &&
          ((left != null ? left.startOffset : undefined) === (right != null ? right.startOffset : undefined)) &&
          ((left != null ? left.endContainer : undefined) === (right != null ? right.endContainer : undefined)) &&
          ((left != null ? left.endOffset : undefined) === (right != null ? right.endOffset : undefined))
      ;
    }
    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.update = this.update.bind(this);
      this.run = this.run.bind(this);
      this.selectionManagers = [];
    }

    start() {
      if (!this.started) {
        this.started = true;
        if ("onselectionchange" in document) {
          return document.addEventListener("selectionchange", this.update, true);
        } else {
          return this.run();
        }
      }
    }

    stop() {
      if (this.started) {
        this.started = false;
        return document.removeEventListener("selectionchange", this.update, true);
      }
    }

    registerSelectionManager(selectionManager) {
      if (!Array.from(this.selectionManagers).includes(selectionManager)) {
        this.selectionManagers.push(selectionManager);
        return this.start();
      }
    }

    unregisterSelectionManager(selectionManager) {
      this.selectionManagers = (Array.from(this.selectionManagers).filter((s) => s !== selectionManager));
      if (this.selectionManagers.length === 0) { return this.stop(); }
    }

    notifySelectionManagersOfSelectionChange() {
      return Array.from(this.selectionManagers).map((selectionManager) =>
        selectionManager.selectionDidChange());
    }

    update() {
      const domRange = getDOMRange();
      if (!domRangesAreEqual(domRange, this.domRange)) {
        this.domRange = domRange;
        return this.notifySelectionManagersOfSelectionChange();
      }
    }

    reset() {
      this.domRange = null;
      return this.update();
    }

    // Private

    run() {
      if (this.started) {
        this.update();
        return requestAnimationFrame(this.run);
      }
    }
  });
  Cls.initClass();
  return Cls;
})();

if (Trix.selectionChangeObserver == null) { Trix.selectionChangeObserver = new Trix.SelectionChangeObserver; }
