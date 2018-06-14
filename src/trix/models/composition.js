/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/document
//= require trix/models/line_break_insertion

const {normalizeRange, rangesAreEqual, rangeIsCollapsed, objectsAreEqual, arrayStartsWith, summarizeArrayChange, getAllAttributeNames, getBlockConfig, getTextConfig, extend} = Trix;

(function() {
  let placeholder = undefined;
  const Cls = (Trix.Composition = class Composition extends Trix.BasicObject {
    static initClass() {
  
      placeholder = " ";
  
      // Selection
  
      this.proxyMethod("getSelectionManager().getPointRange");
      this.proxyMethod("getSelectionManager().setLocationRangeFromPointRange");
      this.proxyMethod("getSelectionManager().locationIsCursorTarget");
      this.proxyMethod("getSelectionManager().selectionIsExpanded");
      this.proxyMethod("delegate?.getSelectionManager");
    }
    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.document = new Trix.Document;
      this.attachments = [];
      this.currentAttributes = {};
      this.revision = 0;
    }

    setDocument(document) {
      if (!document.isEqualTo(this.document)) {
        this.document = document;
        this.refreshAttachments();
        this.revision++;
        return __guardMethod__(this.delegate, 'compositionDidChangeDocument', o => o.compositionDidChangeDocument(document));
      }
    }

    // Snapshots

    getSnapshot() {
      return {
        document: this.document,
        selectedRange: this.getSelectedRange()
      };
    }

    loadSnapshot({document, selectedRange}) {
      __guardMethod__(this.delegate, 'compositionWillLoadSnapshot', o => o.compositionWillLoadSnapshot());
      this.setDocument(document != null ? document : new Trix.Document);
      this.setSelection(selectedRange != null ? selectedRange : [0, 0]);
      return __guardMethod__(this.delegate, 'compositionDidLoadSnapshot', o1 => o1.compositionDidLoadSnapshot());
    }

    // Responder protocol

    insertText(text, param) {
      if (param == null) { param = {updatePosition: true}; }
      const {updatePosition} = param;
      const selectedRange = this.getSelectedRange();
      this.setDocument(this.document.insertTextAtRange(text, selectedRange));

      const startPosition = selectedRange[0];
      const endPosition = startPosition + text.getLength();

      if (updatePosition) { this.setSelection(endPosition); }
      return this.notifyDelegateOfInsertionAtRange([startPosition, endPosition]);
    }

    insertBlock(block) {
      if (block == null) { block = new Trix.Block; }
      const document = new Trix.Document([block]);
      return this.insertDocument(document);
    }

    insertDocument(document) {
      if (document == null) { document = new Trix.Document; }
      const selectedRange = this.getSelectedRange();
      this.setDocument(this.document.insertDocumentAtRange(document, selectedRange));

      const startPosition = selectedRange[0];
      const endPosition = startPosition + document.getLength();

      this.setSelection(endPosition);
      return this.notifyDelegateOfInsertionAtRange([startPosition, endPosition]);
    }

    insertString(string, options) {
      const attributes = this.getCurrentTextAttributes();
      const text = Trix.Text.textForStringWithAttributes(string, attributes);
      return this.insertText(text, options);
    }

    insertBlockBreak() {
      const selectedRange = this.getSelectedRange();
      this.setDocument(this.document.insertBlockBreakAtRange(selectedRange));

      const startPosition = selectedRange[0];
      const endPosition = startPosition + 1;

      this.setSelection(endPosition);
      return this.notifyDelegateOfInsertionAtRange([startPosition, endPosition]);
    }

    insertLineBreak() {
      const insertion = new Trix.LineBreakInsertion(this);

      if (insertion.shouldDecreaseListLevel()) {
        this.decreaseListLevel();
        return this.setSelection(insertion.startPosition);
      } else if (insertion.shouldPrependListItem()) {
        const document = new Trix.Document([insertion.block.copyWithoutText()]);
        return this.insertDocument(document);
      } else if (insertion.shouldInsertBlockBreak()) {
        return this.insertBlockBreak();
      } else if (insertion.shouldRemoveLastBlockAttribute()) {
        return this.removeLastBlockAttribute();
      } else if (insertion.shouldBreakFormattedBlock()) {
        return this.breakFormattedBlock(insertion);
      } else {
        return this.insertString("\n");
      }
    }

    insertHTML(html) {
      const document = Trix.Document.fromHTML(html);
      const selectedRange = this.getSelectedRange();

      this.setDocument(this.document.mergeDocumentAtRange(document, selectedRange));

      const startPosition = selectedRange[0];
      const endPosition = (startPosition + document.getLength()) - 1;

      this.setSelection(endPosition);
      return this.notifyDelegateOfInsertionAtRange([startPosition, endPosition]);
    }

    replaceHTML(html) {
      const document = Trix.Document.fromHTML(html).copyUsingObjectsFromDocument(this.document);
      const locationRange = this.getLocationRange({strict: false});
      const selectedRange = this.document.rangeFromLocationRange(locationRange);
      this.setDocument(document);
      return this.setSelection(selectedRange);
    }

    insertFile(file) {
      if (this.delegate != null ? this.delegate.compositionShouldAcceptFile(file) : undefined) {
        const attachment = Trix.Attachment.attachmentForFile(file);
        return this.insertAttachment(attachment);
      }
    }

    insertFiles(files) {
      const attributes = this.getCurrentTextAttributes();
      let text = new Trix.Text;
      for (let file of Array.from(files)) {
        if ((this.delegate != null ? this.delegate.compositionShouldAcceptFile(file) : undefined)) {
          const attachment = Trix.Attachment.attachmentForFile(file);
          const attachmentText = Trix.Text.textForAttachmentWithAttributes(attachment, attributes);
          text = text.appendText(attachmentText);
        }
      }
      return this.insertText(text);
    }

    insertAttachment(attachment) {
      const attributes = this.getCurrentTextAttributes();
      const text = Trix.Text.textForAttachmentWithAttributes(attachment, attributes);
      return this.insertText(text);
    }

    deleteInDirection(direction) {
      let attachment, deletingIntoPreviousBlock, selectionSpansBlocks;
      const locationRange = this.getLocationRange();
      let range = this.getSelectedRange();
      const selectionIsCollapsed = rangeIsCollapsed(range);

      if (selectionIsCollapsed) {
        deletingIntoPreviousBlock = (direction === "backward") && (locationRange[0].offset === 0);
      } else {
        selectionSpansBlocks = locationRange[0].index !== locationRange[1].index;
      }

      if (deletingIntoPreviousBlock) {
        if (this.canDecreaseBlockAttributeLevel()) {
          const block = this.getBlock();

          if (block.isListItem()) {
            this.decreaseListLevel();
          } else {
            this.decreaseBlockAttributeLevel();
          }

          this.setSelection(range[0]);
          if (block.isEmpty()) { return false; }
        }
      }

      if (selectionIsCollapsed) {
        range = this.getExpandedRangeInDirection(direction);
        if (direction === "backward") {
          attachment = this.getAttachmentAtRange(range);
        }
      }

      if (attachment) {
        this.editAttachment(attachment);
        return false;
      } else {
        this.setDocument(this.document.removeTextAtRange(range));
        this.setSelection(range[0]);
        if (deletingIntoPreviousBlock || selectionSpansBlocks) { return false; }
      }
    }

    moveTextFromRange(range) {
      const [position] = Array.from(this.getSelectedRange());
      this.setDocument(this.document.moveTextFromRangeToPosition(range, position));
      return this.setSelection(position);
    }

    removeAttachment(attachment) {
      let range;
      if (range = this.document.getRangeOfAttachment(attachment)) {
        this.stopEditingAttachment();
        this.setDocument(this.document.removeTextAtRange(range));
        return this.setSelection(range[0]);
      }
    }

    removeLastBlockAttribute() {
      const [startPosition, endPosition] = Array.from(this.getSelectedRange());
      const block = this.document.getBlockAtPosition(endPosition);
      this.removeCurrentAttribute(block.getLastAttribute());
      return this.setSelection(startPosition);
    }

    insertPlaceholder() {
      this.placeholderPosition = this.getPosition();
      return this.insertString(placeholder);
    }

    selectPlaceholder() {
      if (this.placeholderPosition != null) {
        this.setSelectedRange([this.placeholderPosition, this.placeholderPosition + placeholder.length]);
        return this.getSelectedRange();
      }
    }

    forgetPlaceholder() {
      return this.placeholderPosition = null;
    }

    // Current attributes

    hasCurrentAttribute(attributeName) {
      const value = this.currentAttributes[attributeName];
      return (value != null) && (value !== false);
    }

    toggleCurrentAttribute(attributeName) {
      let value;
      if ((value = !this.currentAttributes[attributeName])) {
        return this.setCurrentAttribute(attributeName, value);
      } else {
        return this.removeCurrentAttribute(attributeName);
      }
    }

    canSetCurrentAttribute(attributeName) {
      if (getBlockConfig(attributeName)) {
        return this.canSetCurrentBlockAttribute(attributeName);
      } else {
        return this.canSetCurrentTextAttribute(attributeName);
      }
    }

    canSetCurrentTextAttribute(attributeName) {
      switch (attributeName) {
        case "href":
          return !this.selectionContainsAttachmentWithAttribute(attributeName);
        default:
          return true;
      }
    }

    canSetCurrentBlockAttribute(attributeName) {
      let block;
      if (!(block = this.getBlock())) { return; }
      return !block.isTerminalBlock();
    }

    setCurrentAttribute(attributeName, value) {
      if (getBlockConfig(attributeName)) {
        return this.setBlockAttribute(attributeName, value);
      } else {
        this.setTextAttribute(attributeName, value);
        this.currentAttributes[attributeName] = value;
        return this.notifyDelegateOfCurrentAttributesChange();
      }
    }

    setTextAttribute(attributeName, value) {
      let selectedRange;
      if (!(selectedRange = this.getSelectedRange())) { return; }
      const [startPosition, endPosition] = Array.from(selectedRange);
      if (startPosition === endPosition) {
        if (attributeName === "href") {
          const text = Trix.Text.textForStringWithAttributes(value, {href: value});
          return this.insertText(text);
        }
      } else {
        return this.setDocument(this.document.addAttributeAtRange(attributeName, value, selectedRange));
      }
    }

    setBlockAttribute(attributeName, value) {
      let selectedRange;
      if (!(selectedRange = this.getSelectedRange())) { return; }
      if (this.canSetCurrentAttribute(attributeName)) {
        const block = this.getBlock();
        this.setDocument(this.document.applyBlockAttributeAtRange(attributeName, value, selectedRange));
        return this.setSelection(selectedRange);
      }
    }

    removeCurrentAttribute(attributeName) {
      if (getBlockConfig(attributeName)) {
        this.removeBlockAttribute(attributeName);
        return this.updateCurrentAttributes();
      } else {
        this.removeTextAttribute(attributeName);
        delete this.currentAttributes[attributeName];
        return this.notifyDelegateOfCurrentAttributesChange();
      }
    }

    removeTextAttribute(attributeName) {
      let selectedRange;
      if (!(selectedRange = this.getSelectedRange())) { return; }
      return this.setDocument(this.document.removeAttributeAtRange(attributeName, selectedRange));
    }

    removeBlockAttribute(attributeName) {
      let selectedRange;
      if (!(selectedRange = this.getSelectedRange())) { return; }
      return this.setDocument(this.document.removeAttributeAtRange(attributeName, selectedRange));
    }

    canDecreaseNestingLevel() {
      return __guard__(this.getBlock(), x => x.getNestingLevel()) > 0;
    }

    canIncreaseNestingLevel() {
      let block;
      if (!(block = this.getBlock())) { return; }
      if (__guard__(getBlockConfig(block.getLastNestableAttribute()), x => x.listAttribute)) {
        let previousBlock;
        if (previousBlock = this.getPreviousBlock()) {
          return arrayStartsWith(previousBlock.getListItemAttributes(), block.getListItemAttributes());
        }
      } else {
        return block.getNestingLevel() > 0;
      }
    }

    decreaseNestingLevel() {
      let block;
      if (!(block = this.getBlock())) { return; }
      return this.setDocument(this.document.replaceBlock(block, block.decreaseNestingLevel()));
    }

    increaseNestingLevel() {
      let block;
      if (!(block = this.getBlock())) { return; }
      return this.setDocument(this.document.replaceBlock(block, block.increaseNestingLevel()));
    }

    canDecreaseBlockAttributeLevel() {
      return __guard__(this.getBlock(), x => x.getAttributeLevel()) > 0;
    }

    decreaseBlockAttributeLevel() {
      let attribute;
      if (attribute = __guard__(this.getBlock(), x => x.getLastAttribute())) {
        return this.removeCurrentAttribute(attribute);
      }
    }

    decreaseListLevel() {
      let block;
      let [startPosition] = Array.from(this.getSelectedRange());
      const {index} = this.document.locationFromPosition(startPosition);
      let endIndex = index;
      const attributeLevel = this.getBlock().getAttributeLevel();

      while ((block = this.document.getBlockAtIndex(endIndex + 1))) {
        if (!block.isListItem() || !(block.getAttributeLevel() > attributeLevel)) { break; }
        endIndex++;
      }

      startPosition = this.document.positionFromLocation({index, offset: 0});
      const endPosition = this.document.positionFromLocation({index: endIndex, offset: 0});
      return this.setDocument(this.document.removeLastListAttributeAtRange([startPosition, endPosition]));
    }

    updateCurrentAttributes() {
      let selectedRange;
      if (selectedRange = this.getSelectedRange({ignoreLock: true})) {
        const currentAttributes = this.document.getCommonAttributesAtRange(selectedRange);

        for (let attributeName of Array.from(getAllAttributeNames())) {
          if (!currentAttributes[attributeName]) {
            if (!this.canSetCurrentAttribute(attributeName)) {
              currentAttributes[attributeName] = false;
            }
          }
        }

        if (!objectsAreEqual(currentAttributes, this.currentAttributes)) {
          this.currentAttributes = currentAttributes;
          return this.notifyDelegateOfCurrentAttributesChange();
        }
      }
    }

    getCurrentAttributes() {
      return extend.call({}, this.currentAttributes);
    }

    getCurrentTextAttributes() {
      const attributes = {};
      for (let key in this.currentAttributes) { const value = this.currentAttributes[key]; if (getTextConfig(key)) { attributes[key] = value; } }
      return attributes;
    }

    // Selection freezing

    freezeSelection() {
      return this.setCurrentAttribute("frozen", true);
    }

    thawSelection() {
      return this.removeCurrentAttribute("frozen");
    }

    hasFrozenSelection() {
      return this.hasCurrentAttribute("frozen");
    }

    setSelection(selectedRange) {
      const locationRange = this.document.locationRangeFromRange(selectedRange);
      return (this.delegate != null ? this.delegate.compositionDidRequestChangingSelectionToLocationRange(locationRange) : undefined);
    }

    getSelectedRange() {
      let locationRange;
      if (locationRange = this.getLocationRange()) {
        return this.document.rangeFromLocationRange(locationRange);
      }
    }

    setSelectedRange(selectedRange) {
      const locationRange = this.document.locationRangeFromRange(selectedRange);
      return this.getSelectionManager().setLocationRange(locationRange);
    }

    getPosition() {
      let locationRange;
      if (locationRange = this.getLocationRange()) {
        return this.document.positionFromLocation(locationRange[0]);
      }
    }

    getLocationRange(options) {
      let left;
      return (left = this.getSelectionManager().getLocationRange(options)) != null ? left : normalizeRange({index: 0, offset: 0});
    }

    getExpandedRangeInDirection(direction) {
      let [startPosition, endPosition] = Array.from(this.getSelectedRange());
      if (direction === "backward") {
        startPosition = this.translateUTF16PositionFromOffset(startPosition, -1);
      } else {
        endPosition = this.translateUTF16PositionFromOffset(endPosition, 1);
      }
      return normalizeRange([startPosition, endPosition]);
    }

    moveCursorInDirection(direction) {
      let canEditAttachment, range;
      if (this.editingAttachment) {
        range = this.document.getRangeOfAttachment(this.editingAttachment);
      } else {
        const selectedRange = this.getSelectedRange();
        range = this.getExpandedRangeInDirection(direction);
        canEditAttachment = !rangesAreEqual(selectedRange, range);
      }

      if (direction === "backward") {
        this.setSelectedRange(range[0]);
      } else {
        this.setSelectedRange(range[1]);
      }

      if (canEditAttachment) {
        let attachment;
        if (attachment = this.getAttachmentAtRange(range)) {
          return this.editAttachment(attachment);
        }
      }
    }

    expandSelectionInDirection(direction) {
      const range = this.getExpandedRangeInDirection(direction);
      return this.setSelectedRange(range);
    }

    expandSelectionForEditing() {
      if (this.hasCurrentAttribute("href")) {
        return this.expandSelectionAroundCommonAttribute("href");
      }
    }

    expandSelectionAroundCommonAttribute(attributeName) {
      const position = this.getPosition();
      const range = this.document.getRangeOfCommonAttributeAtPosition(attributeName, position);
      return this.setSelectedRange(range);
    }

    selectionContainsAttachmentWithAttribute(attributeName) {
      let selectedRange;
      if (selectedRange = this.getSelectedRange()) {
        for (let attachment of Array.from(this.document.getDocumentAtRange(selectedRange).getAttachments())) {
          if (attachment.hasAttribute(attributeName)) { return true; }
        }
        return false;
      }
    }

    selectionIsInCursorTarget() {
      return this.editingAttachment || this.positionIsCursorTarget(this.getPosition());
    }

    positionIsCursorTarget(position) {
      let location;
      if (location = this.document.locationFromPosition(position)) {
        return this.locationIsCursorTarget(location);
      }
    }

    positionIsBlockBreak(position) {
      return __guard__(this.document.getPieceAtPosition(position), x => x.isBlockBreak());
    }

    getSelectedDocument() {
      let selectedRange;
      if (selectedRange = this.getSelectedRange()) {
        return this.document.getDocumentAtRange(selectedRange);
      }
    }

    // Attachments

    getAttachments() {
      return this.attachments.slice(0);
    }

    refreshAttachments() {
      const attachments = this.document.getAttachments();
      const {added, removed} = summarizeArrayChange(this.attachments, attachments);
      this.attachments = attachments;

      for (var attachment of Array.from(removed)) {
        attachment.delegate = null;
        __guardMethod__(this.delegate, 'compositionDidRemoveAttachment', o => o.compositionDidRemoveAttachment(attachment));
      }

      return (() => {
        const result = [];
        for (attachment of Array.from(added)) {
          attachment.delegate = this;
          result.push(__guardMethod__(this.delegate, 'compositionDidAddAttachment', o1 => o1.compositionDidAddAttachment(attachment)));
        }
        return result;
      })();
    }

    // Attachment delegate

    attachmentDidChangeAttributes(attachment) {
      this.revision++;
      return __guardMethod__(this.delegate, 'compositionDidEditAttachment', o => o.compositionDidEditAttachment(attachment));
    }

    attachmentDidChangePreviewURL(attachment) {
      this.revision++;
      return __guardMethod__(this.delegate, 'compositionDidChangeAttachmentPreviewURL', o => o.compositionDidChangeAttachmentPreviewURL(attachment));
    }

    // Attachment editing

    editAttachment(attachment) {
      if (attachment === this.editingAttachment) { return; }
      this.stopEditingAttachment();
      this.editingAttachment = attachment;
      return __guardMethod__(this.delegate, 'compositionDidStartEditingAttachment', o => o.compositionDidStartEditingAttachment(this.editingAttachment));
    }

    stopEditingAttachment() {
      if (!this.editingAttachment) { return; }
      __guardMethod__(this.delegate, 'compositionDidStopEditingAttachment', o => o.compositionDidStopEditingAttachment(this.editingAttachment));
      return this.editingAttachment = null;
    }

    canEditAttachmentCaption() {
      return (this.editingAttachment != null ? this.editingAttachment.isPreviewable() : undefined);
    }

    updateAttributesForAttachment(attributes, attachment) {
      return this.setDocument(this.document.updateAttributesForAttachment(attributes, attachment));
    }

    removeAttributeForAttachment(attribute, attachment) {
      return this.setDocument(this.document.removeAttributeForAttachment(attribute, attachment));
    }

    // Private

    breakFormattedBlock(insertion) {
      let {document, block} = insertion;
      let position = insertion.startPosition;
      let range = [position - 1, position];

      if (block.getBlockBreakPosition() === insertion.startLocation.offset) {
        if (block.breaksOnReturn() && (insertion.nextCharacter === "\n")) {
          position += 1;
        } else {
          document = document.removeTextAtRange(range);
        }
        range = [position, position];
      } else if (insertion.nextCharacter === "\n") {
        if (insertion.previousCharacter === "\n") {
          range = [position - 1, position + 1];
        } else {
          range = [position, position + 1];
          position += 1;
        }
      } else if ((insertion.startLocation.offset - 1) !== 0) {
        position += 1;
      }

      const newDocument = new Trix.Document([block.removeLastAttribute().copyWithoutText()]);
      this.setDocument(document.insertDocumentAtRange(newDocument, range));
      return this.setSelection(position);
    }

    getPreviousBlock() {
      let locationRange;
      if (locationRange = this.getLocationRange()) {
        const {index} = locationRange[0];
        if (index > 0) { return this.document.getBlockAtIndex(index - 1); }
      }
    }

    getBlock() {
      let locationRange;
      if (locationRange = this.getLocationRange()) {
        return this.document.getBlockAtIndex(locationRange[0].index);
      }
    }

    getAttachmentAtRange(range) {
      const document = this.document.getDocumentAtRange(range);
      if (document.toString() === `${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`) {
        return document.getAttachments()[0];
      }
    }

    notifyDelegateOfCurrentAttributesChange() {
      return __guardMethod__(this.delegate, 'compositionDidChangeCurrentAttributes', o => o.compositionDidChangeCurrentAttributes(this.currentAttributes));
    }

    notifyDelegateOfInsertionAtRange(range) {
      return __guardMethod__(this.delegate, 'compositionDidPerformInsertionAtRange', o => o.compositionDidPerformInsertionAtRange(range));
    }

    translateUTF16PositionFromOffset(position, offset) {
      const utf16string = this.document.toUTF16String();
      const utf16position = utf16string.offsetFromUCS2Offset(position);
      return utf16string.offsetToUCS2Offset(utf16position + offset);
    }
  });
  Cls.initClass();
  return Cls;
})();

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}