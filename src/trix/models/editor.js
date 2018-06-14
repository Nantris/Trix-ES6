/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/undo_manager

Trix.Editor = class Editor {
  constructor(composition, selectionManager, element) {
    this.composition = composition;
    this.selectionManager = selectionManager;
    this.element = element;
    this.undoManager = new Trix.UndoManager(this.composition);
  }

  loadDocument(document) {
    return this.loadSnapshot({document, selectedRange: [0, 0]});
  }

  loadHTML(html) {
    if (html == null) { html = ""; }
    return this.loadDocument(Trix.Document.fromHTML(html, {referenceElement: this.element}));
  }

  loadJSON({document, selectedRange}) {
    document = Trix.Document.fromJSON(document);
    return this.loadSnapshot({document, selectedRange});
  }

  loadSnapshot(snapshot) {
    this.undoManager = new Trix.UndoManager(this.composition);
    return this.composition.loadSnapshot(snapshot);
  }

  getDocument() {
    return this.composition.document;
  }

  getSelectedDocument() {
    return this.composition.getSelectedDocument();
  }

  getSnapshot() {
    return this.composition.getSnapshot();
  }

  toJSON() {
    return this.getSnapshot();
  }

  // Document manipulation

  deleteInDirection(direction) {
    return this.composition.deleteInDirection(direction);
  }

  insertAttachment(attachment) {
    return this.composition.insertAttachment(attachment);
  }

  insertDocument(document) {
    return this.composition.insertDocument(document);
  }

  insertFile(file) {
    return this.composition.insertFile(file);
  }

  insertHTML(html) {
    return this.composition.insertHTML(html);
  }

  insertString(string) {
    return this.composition.insertString(string);
  }

  insertText(text) {
    return this.composition.insertText(text);
  }

  insertLineBreak() {
    return this.composition.insertLineBreak();
  }

  // Selection

  getSelectedRange() {
    return this.composition.getSelectedRange();
  }

  getPosition() {
    return this.composition.getPosition();
  }

  getClientRectAtPosition(position) {
    const locationRange = this.getDocument().locationRangeFromRange([position, position + 1]);
    return this.selectionManager.getClientRectAtLocationRange(locationRange);
  }

  expandSelectionInDirection(direction) {
    return this.composition.expandSelectionInDirection(direction);
  }

  moveCursorInDirection(direction) {
    return this.composition.moveCursorInDirection(direction);
  }

  setSelectedRange(selectedRange) {
    return this.composition.setSelectedRange(selectedRange);
  }

  // Attributes

  activateAttribute(name, value) {
    if (value == null) { value = true; }
    return this.composition.setCurrentAttribute(name, value);
  }

  attributeIsActive(name) {
    return this.composition.hasCurrentAttribute(name);
  }

  canActivateAttribute(name) {
    return this.composition.canSetCurrentAttribute(name);
  }

  deactivateAttribute(name) {
    return this.composition.removeCurrentAttribute(name);
  }

  // Nesting level

  canDecreaseNestingLevel() {
    return this.composition.canDecreaseNestingLevel();
  }

  canIncreaseNestingLevel() {
    return this.composition.canIncreaseNestingLevel();
  }

  decreaseNestingLevel() {
    if (this.canDecreaseNestingLevel()) {
      return this.composition.decreaseNestingLevel();
    }
  }

  increaseNestingLevel() {
    if (this.canIncreaseNestingLevel()) {
      return this.composition.increaseNestingLevel();
    }
  }

  // Indentation level (deprecated aliases to be removed in v1.0)

  canDecreaseIndentationLevel() {
    return this.canDecreaseNestingLevel();
  }

  canIncreaseIndentationLevel() {
    return this.canIncreaseNestingLevel();
  }

  decreaseIndentationLevel() {
    return this.decreaseNestingLevel();
  }

  increaseIndentationLevel() {
    return this.increaseNestingLevel();
  }

  // Undo/redo

  canRedo() {
    return this.undoManager.canRedo();
  }

  canUndo() {
    return this.undoManager.canUndo();
  }

  recordUndoEntry(description, param) {
    if (param == null) { param = {}; }
    const {context, consolidatable} = param;
    return this.undoManager.recordUndoEntry(description, {context, consolidatable});
  }

  redo() {
    if (this.canRedo()) {
      return this.undoManager.redo();
    }
  }

  undo() {
    if (this.canUndo()) {
      return this.undoManager.undo();
    }
  }
};
