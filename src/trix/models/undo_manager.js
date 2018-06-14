/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
(function() {
  let entryHasDescriptionAndContext = undefined;
  const Cls = (Trix.UndoManager = class UndoManager extends Trix.BasicObject {
    static initClass() {
  
      entryHasDescriptionAndContext = (entry, description, context) => ((entry != null ? entry.description : undefined) === (description != null ? description.toString() : undefined)) && ((entry != null ? entry.context : undefined) === JSON.stringify(context));
    }
    constructor(composition) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.composition = composition;
      this.undoEntries = [];
      this.redoEntries = [];
    }

    recordUndoEntry(description, param) {
      if (param == null) { param = {}; }
      const {context, consolidatable} = param;
      const previousEntry = this.undoEntries.slice(-1)[0];

      if (!consolidatable || !entryHasDescriptionAndContext(previousEntry, description, context)) {
        const undoEntry = this.createEntry({description, context});
        this.undoEntries.push(undoEntry);
        return this.redoEntries = [];
      }
    }

    undo() {
      let undoEntry;
      if (undoEntry = this.undoEntries.pop()) {
        const redoEntry = this.createEntry(undoEntry);
        this.redoEntries.push(redoEntry);
        return this.composition.loadSnapshot(undoEntry.snapshot);
      }
    }

    redo() {
      let redoEntry;
      if (redoEntry = this.redoEntries.pop()) {
        const undoEntry = this.createEntry(redoEntry);
        this.undoEntries.push(undoEntry);
        return this.composition.loadSnapshot(redoEntry.snapshot);
      }
    }

    canUndo() {
      return this.undoEntries.length > 0;
    }

    canRedo() {
      return this.redoEntries.length > 0;
    }

    // Private

    createEntry(param) {
      if (param == null) { param = {}; }
      const {description, context} = param;
      return {
        description: (description != null ? description.toString() : undefined),
        context: JSON.stringify(context),
        snapshot: this.composition.getSnapshot()
      };
    }
  });
  Cls.initClass();
  return Cls;
})();
