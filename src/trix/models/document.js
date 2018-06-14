/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/block
//= require trix/models/splittable_list
//= require trix/models/html_parser

const {arraysAreEqual, normalizeRange, rangeIsCollapsed, getBlockConfig} = Trix;

(function() {
  let attributesForBlock = undefined;
  const Cls = (Trix.Document = class Document extends Trix.Object {
    static initClass() {
  
      attributesForBlock = function(block) {
        let attributeName;
        const attributes = {};
        if (attributeName = block.getLastAttribute()) {
          attributes[attributeName] = true;
        }
        return attributes;
      };
    }
    static fromJSON(documentJSON) {
      const blocks = Array.from(documentJSON).map((blockJSON) =>
        Trix.Block.fromJSON(blockJSON));
      return new (this)(blocks);
    }

    static fromHTML(html, options) {
      return Trix.HTMLParser.parse(html, options).getDocument();
    }

    static fromString(string, textAttributes) {
      const text = Trix.Text.textForStringWithAttributes(string, textAttributes);
      return new (this)([new Trix.Block(text)]);
    }


    constructor(blocks) {
      if (blocks == null) { blocks = []; }
      super(...arguments);
      if (blocks.length === 0) { blocks = [new Trix.Block]; }
      this.blockList = Trix.SplittableList.box(blocks);
    }

    isEmpty() {
      let block;
      return (this.blockList.length === 1) && (
        (block = this.getBlockAtIndex(0)),
        block.isEmpty() && !block.hasAttributes()
      );
    }

    copy(options){
      if (options == null) { options = {}; }
      const blocks = options.consolidateBlocks ?
        this.blockList.consolidate().toArray()
      :
        this.blockList.toArray();

      return new this.constructor(blocks);
    }

    copyUsingObjectsFromDocument(sourceDocument) {
      const objectMap = new Trix.ObjectMap(sourceDocument.getObjects());
      return this.copyUsingObjectMap(objectMap);
    }

    copyUsingObjectMap(objectMap) {
      let mappedBlock;
      const blocks = Array.from(this.getBlocks()).map((block) =>
        (mappedBlock = objectMap.find(block)) ?
          mappedBlock
        :
          block.copyUsingObjectMap(objectMap));
      return new this.constructor(blocks);
    }

    copyWithBaseBlockAttributes(blockAttributes) {
      if (blockAttributes == null) { blockAttributes = []; }
      const blocks = (() => {
        const result = [];
        for (let block of Array.from(this.getBlocks())) {
          const attributes = blockAttributes.concat(block.getAttributes());
          result.push(block.copyWithAttributes(attributes));
        }
        return result;
      })();
      return new this.constructor(blocks);
    }

    replaceBlock(oldBlock, newBlock) {
      const index = this.blockList.indexOf(oldBlock);
      if (index === -1) { return this; }
      return new this.constructor(this.blockList.replaceObjectAtIndex(newBlock, index));
    }

    insertDocumentAtRange(document, range) {
      const {blockList} = document;
      let [position] = Array.from((range = normalizeRange(range)));
      const {index, offset} = this.locationFromPosition(position);

      let result = this;
      const block = this.getBlockAtPosition(position);

      if (rangeIsCollapsed(range) && block.isEmpty() && !block.hasAttributes()) {
        result = new this.constructor(result.blockList.removeObjectAtIndex(index));
      } else if (block.getBlockBreakPosition() === offset) {
        position++;
      }

      result = result.removeTextAtRange(range);
      return new this.constructor(result.blockList.insertSplittableListAtPosition(blockList, position));
    }

    mergeDocumentAtRange(document, range) {
      let formattedDocument, result;
      const [startPosition] = Array.from((range = normalizeRange(range)));
      const startLocation = this.locationFromPosition(startPosition);
      const blockAttributes = this.getBlockAtIndex(startLocation.index).getAttributes();
      const baseBlockAttributes = document.getBaseBlockAttributes();
      const trailingBlockAttributes = blockAttributes.slice(-baseBlockAttributes.length);

      if (arraysAreEqual(baseBlockAttributes, trailingBlockAttributes)) {
        const leadingBlockAttributes = blockAttributes.slice(0, -baseBlockAttributes.length);
        formattedDocument = document.copyWithBaseBlockAttributes(leadingBlockAttributes);
      } else {
        formattedDocument = document.copy({consolidateBlocks: true}).copyWithBaseBlockAttributes(blockAttributes);
      }

      const blockCount = formattedDocument.getBlockCount();
      const firstBlock = formattedDocument.getBlockAtIndex(0);

      if (arraysAreEqual(blockAttributes, firstBlock.getAttributes())) {
        const firstText = firstBlock.getTextWithoutBlockBreak();
        result = this.insertTextAtRange(firstText, range);

        if (blockCount > 1) {
          formattedDocument = new this.constructor(formattedDocument.getBlocks().slice(1));
          const position = startPosition + firstText.getLength();
          result = result.insertDocumentAtRange(formattedDocument, position);
        }
      } else {
        result = this.insertDocumentAtRange(formattedDocument, range);
      }

      return result;
    }

    insertTextAtRange(text, range) {
      const [startPosition] = Array.from((range = normalizeRange(range)));
      const {index, offset} = this.locationFromPosition(startPosition);

      const document = this.removeTextAtRange(range);
      return new this.constructor(document.blockList.editObjectAtIndex(index, block => block.copyWithText(block.text.insertTextAtPosition(text, offset)))
      );
    }

    removeTextAtRange(range) {
      let blocks;
      const [leftPosition, rightPosition] = Array.from((range = normalizeRange(range)));
      if (rangeIsCollapsed(range)) { return this; }
      const [leftLocation, rightLocation] = Array.from(this.locationRangeFromRange(range));

      const leftIndex = leftLocation.index;
      const leftOffset = leftLocation.offset;
      const leftBlock = this.getBlockAtIndex(leftIndex);

      const rightIndex = rightLocation.index;
      const rightOffset = rightLocation.offset;
      const rightBlock = this.getBlockAtIndex(rightIndex);

      const removeRightNewline = ((rightPosition - leftPosition) === 1) &&
        (leftBlock.getBlockBreakPosition() === leftOffset) &&
        (rightBlock.getBlockBreakPosition() !== rightOffset) &&
        (rightBlock.text.getStringAtPosition(rightOffset) === "\n");

      if (removeRightNewline) {
        blocks = this.blockList.editObjectAtIndex(rightIndex, block => block.copyWithText(block.text.removeTextAtRange([rightOffset, rightOffset + 1])));
      } else {
        let block;
        const leftText = leftBlock.text.getTextAtRange([0, leftOffset]);
        const rightText = rightBlock.text.getTextAtRange([rightOffset, rightBlock.getLength()]);
        const text = leftText.appendText(rightText);

        const removingLeftBlock = (leftIndex !== rightIndex) && (leftOffset === 0);
        const useRightBlock = removingLeftBlock && (leftBlock.getAttributeLevel() >= rightBlock.getAttributeLevel());

        if (useRightBlock) {
          block = rightBlock.copyWithText(text);
        } else {
          block = leftBlock.copyWithText(text);
        }

        const affectedBlockCount = (rightIndex + 1) - leftIndex;
        blocks = this.blockList.splice(leftIndex, affectedBlockCount, block);
      }

      return new this.constructor(blocks);
    }

    moveTextFromRangeToPosition(range, position) {
      const [startPosition, endPosition] = Array.from((range = normalizeRange(range)));
      if (startPosition <= position && position <= endPosition) { return this; }

      let document = this.getDocumentAtRange(range);
      let result = this.removeTextAtRange(range);

      const movingRightward = startPosition < position;
      if (movingRightward) { position -= document.getLength(); }

      if (!result.firstBlockInRangeIsEntirelySelected(range)) {
        let text;
        const [firstBlock, ...blocks] = Array.from(document.getBlocks());
        if (blocks.length === 0) {
          text = firstBlock.getTextWithoutBlockBreak();
          if (movingRightward) { position += 1; }
        } else {
          ({ text } = firstBlock);
        }

        result = result.insertTextAtRange(text, position);
        if (blocks.length === 0) { return result; }

        document = new this.constructor(blocks);
        position += text.getLength();
      }

      return result.insertDocumentAtRange(document, position);
    }

    addAttributeAtRange(attribute, value, range) {
      let { blockList } = this;
      this.eachBlockAtRange(range, (block, textRange, index) =>
        blockList = blockList.editObjectAtIndex(index, function() {
          if (getBlockConfig(attribute)) {
            return block.addAttribute(attribute, value);
          } else {
            if (textRange[0] === textRange[1]) {
              return block;
            } else {
              return block.copyWithText(block.text.addAttributeAtRange(attribute, value, textRange));
            }
          }
        })
      );
      return new this.constructor(blockList);
    }

    addAttribute(attribute, value) {
      let { blockList } = this;
      this.eachBlock((block, index) =>
        blockList = blockList.editObjectAtIndex((index), () => block.addAttribute(attribute, value))
      );
      return new this.constructor(blockList);
    }

    removeAttributeAtRange(attribute, range) {
      let { blockList } = this;
      this.eachBlockAtRange(range, function(block, textRange, index) {
        if (getBlockConfig(attribute)) {
          return blockList = blockList.editObjectAtIndex(index, () => block.removeAttribute(attribute));
        } else if (textRange[0] !== textRange[1]) {
          return blockList = blockList.editObjectAtIndex(index, () => block.copyWithText(block.text.removeAttributeAtRange(attribute, textRange)));
        }
      });
      return new this.constructor(blockList);
    }

    updateAttributesForAttachment(attributes, attachment) {
      let range;
      const [startPosition] = Array.from((range = this.getRangeOfAttachment(attachment)));
      const {index} = this.locationFromPosition(startPosition);
      const text = this.getTextAtIndex(index);

      return new this.constructor(this.blockList.editObjectAtIndex(index, block => block.copyWithText(text.updateAttributesForAttachment(attributes, attachment)))
      );
    }

    removeAttributeForAttachment(attribute, attachment) {
      const range = this.getRangeOfAttachment(attachment);
      return this.removeAttributeAtRange(attribute, range);
    }

    insertBlockBreakAtRange(range) {
      let blocks;
      const [startPosition] = Array.from((range = normalizeRange(range)));
      const {offset} = this.locationFromPosition(startPosition);

      const document = this.removeTextAtRange(range);
      if (offset === 0) { blocks = [new Trix.Block]; }
      return new this.constructor(document.blockList.insertSplittableListAtPosition(new Trix.SplittableList(blocks), startPosition));
    }

    applyBlockAttributeAtRange(attributeName, value, range) {
      let document;
      ({document, range} = this.expandRangeToLineBreaksAndSplitBlocks(range));
      const config = getBlockConfig(attributeName);

      if (config.listAttribute) {
        document = document.removeLastListAttributeAtRange(range, {exceptAttributeName: attributeName});
        ({document, range} = document.convertLineBreaksToBlockBreaksInRange(range));
      } else if (config.terminal) {
        document = document.removeLastTerminalAttributeAtRange(range);
      } else {
        document = document.consolidateBlocksAtRange(range);
      }

      return document.addAttributeAtRange(attributeName, value, range);
    }

    removeLastListAttributeAtRange(range, options) {
      if (options == null) { options = {}; }
      let { blockList } = this;
      this.eachBlockAtRange(range, function(block, textRange, index) {
        let lastAttributeName;
        if (!(lastAttributeName = block.getLastAttribute())) { return; }
        if (!getBlockConfig(lastAttributeName).listAttribute) { return; }
        if (lastAttributeName === options.exceptAttributeName) { return; }
        return blockList = blockList.editObjectAtIndex(index, () => block.removeAttribute(lastAttributeName));
      });
      return new this.constructor(blockList);
    }

    removeLastTerminalAttributeAtRange(range) {
      let { blockList } = this;
      this.eachBlockAtRange(range, function(block, textRange, index) {
        let lastAttributeName;
        if (!(lastAttributeName = block.getLastAttribute())) { return; }
        if (!getBlockConfig(lastAttributeName).terminal) { return; }
        return blockList = blockList.editObjectAtIndex(index, () => block.removeAttribute(lastAttributeName));
      });
      return new this.constructor(blockList);
    }

    firstBlockInRangeIsEntirelySelected(range) {
      const [startPosition, endPosition] = Array.from((range = normalizeRange(range)));
      const leftLocation = this.locationFromPosition(startPosition);
      const rightLocation = this.locationFromPosition(endPosition);

      if ((leftLocation.offset === 0) && (leftLocation.index < rightLocation.index)) {
        return true;
      } else if (leftLocation.index === rightLocation.index) {
        const length = this.getBlockAtIndex(leftLocation.index).getLength();
        return (leftLocation.offset === 0) && (rightLocation.offset === length);
      } else {
        return false;
      }
    }

    expandRangeToLineBreaksAndSplitBlocks(range) {
      let position;
      let [startPosition, endPosition] = Array.from((range = normalizeRange(range)));
      const startLocation = this.locationFromPosition(startPosition);
      const endLocation = this.locationFromPosition(endPosition);
      let document = this;

      const startBlock = document.getBlockAtIndex(startLocation.index);
      if ((startLocation.offset = startBlock.findLineBreakInDirectionFromPosition("backward", startLocation.offset)) != null) {
        position = document.positionFromLocation(startLocation);
        document = document.insertBlockBreakAtRange([position, position + 1]);
        endLocation.index += 1;
        endLocation.offset -= document.getBlockAtIndex(startLocation.index).getLength();
        startLocation.index += 1;
      }
      startLocation.offset = 0;

      if ((endLocation.offset === 0) && (endLocation.index > startLocation.index)) {
        endLocation.index -= 1;
        endLocation.offset = document.getBlockAtIndex(endLocation.index).getBlockBreakPosition();
      } else {
        const endBlock = document.getBlockAtIndex(endLocation.index);
        if (endBlock.text.getStringAtRange([endLocation.offset - 1, endLocation.offset]) === "\n") {
          endLocation.offset -= 1;
        } else {
          endLocation.offset = endBlock.findLineBreakInDirectionFromPosition("forward", endLocation.offset);
        }
        if (endLocation.offset !== endBlock.getBlockBreakPosition()) {
          position = document.positionFromLocation(endLocation);
          document = document.insertBlockBreakAtRange([position, position + 1]);
        }
      }

      startPosition = document.positionFromLocation(startLocation);
      endPosition = document.positionFromLocation(endLocation);
      range = normalizeRange([startPosition, endPosition]);

      return {document, range};
    }

    convertLineBreaksToBlockBreaksInRange(range) {
      let [position] = Array.from((range = normalizeRange(range)));
      const string = this.getStringAtRange(range).slice(0, -1);
      let document = this;

      string.replace(/.*?\n/g, function(match) {
        position += match.length;
        return document = document.insertBlockBreakAtRange([position - 1, position]);
      });

      return {document, range};
    }

    consolidateBlocksAtRange(range) {
      const [startPosition, endPosition] = Array.from((range = normalizeRange(range)));
      const startIndex = this.locationFromPosition(startPosition).index;
      const endIndex = this.locationFromPosition(endPosition).index;
      return new this.constructor(this.blockList.consolidateFromIndexToIndex(startIndex, endIndex));
    }

    getDocumentAtRange(range) {
      range = normalizeRange(range);
      const blocks = this.blockList.getSplittableListInRange(range).toArray();
      return new this.constructor(blocks);
    }

    getStringAtRange(range) {
      let endIndex;
      const array = (range = normalizeRange(range)), endPosition = array[array.length - 1];
      if (endPosition !== this.getLength()) { endIndex = -1; }
      return this.getDocumentAtRange(range).toString().slice(0, endIndex);
    }

    getBlockAtIndex(index) {
      return this.blockList.getObjectAtIndex(index);
    }

    getBlockAtPosition(position) {
      const {index} = this.locationFromPosition(position);
      return this.getBlockAtIndex(index);
    }

    getTextAtIndex(index) {
      return __guard__(this.getBlockAtIndex(index), x => x.text);
    }

    getTextAtPosition(position) {
      const {index} = this.locationFromPosition(position);
      return this.getTextAtIndex(index);
    }

    getPieceAtPosition(position) {
      const {index, offset} = this.locationFromPosition(position);
      return this.getTextAtIndex(index).getPieceAtPosition(offset);
    }

    getCharacterAtPosition(position) {
      const {index, offset} = this.locationFromPosition(position);
      return this.getTextAtIndex(index).getStringAtRange([offset, offset + 1]);
    }

    getLength() {
      return this.blockList.getEndPosition();
    }

    getBlocks() {
      return this.blockList.toArray();
    }

    getBlockCount() {
      return this.blockList.length;
    }

    getEditCount() {
      return this.editCount;
    }

    eachBlock(callback) {
      return this.blockList.eachObject(callback);
    }

    eachBlockAtRange(range, callback) {
      let block, textRange;
      const [startPosition, endPosition] = Array.from((range = normalizeRange(range)));
      const startLocation = this.locationFromPosition(startPosition);
      const endLocation = this.locationFromPosition(endPosition);

      if (startLocation.index === endLocation.index) {
        block = this.getBlockAtIndex(startLocation.index);
        textRange = [startLocation.offset, endLocation.offset];
        return callback(block, textRange, startLocation.index);
      } else {
        return (() => {
          const result = [];
          for (var { index } = startLocation, end = endLocation.index, asc = startLocation.index <= end; asc ? index <= end : index >= end; asc ? index++ : index--) {
            if (block = this.getBlockAtIndex(index)) {
              textRange = (() => { switch (index) {
                case startLocation.index:
                  return [startLocation.offset, block.text.getLength()];
                case endLocation.index:
                  return [0, endLocation.offset];
                default:
                  return [0, block.text.getLength()];
              } })();
              result.push(callback(block, textRange, index));
            } else {
              result.push(undefined);
            }
          }
          return result;
        })();
      }
    }

    getCommonAttributesAtRange(range) {
      const [startPosition] = Array.from((range = normalizeRange(range)));
      if (rangeIsCollapsed(range)) {
        return this.getCommonAttributesAtPosition(startPosition);
      } else {
        const textAttributes = [];
        const blockAttributes = [];

        this.eachBlockAtRange(range, function(block, textRange) {
          if (textRange[0] !== textRange[1]) {
            textAttributes.push(block.text.getCommonAttributesAtRange(textRange));
            return blockAttributes.push(attributesForBlock(block));
          }
        });

        return Trix.Hash.fromCommonAttributesOfObjects(textAttributes)
          .merge(Trix.Hash.fromCommonAttributesOfObjects(blockAttributes))
          .toObject();
      }
    }

    getCommonAttributesAtPosition(position) {
      let key, value;
      const {index, offset} = this.locationFromPosition(position);
      const block = this.getBlockAtIndex(index);
      if (!block) { return {}; }

      const commonAttributes = attributesForBlock(block);
      const attributes = block.text.getAttributesAtPosition(offset);
      const attributesLeft = block.text.getAttributesAtPosition(offset - 1);
      const inheritableAttributes = ((() => {
        const result = [];
        for (key in Trix.config.textAttributes) {
          value = Trix.config.textAttributes[key];
          if (value.inheritable) {
            result.push(key);
          }
        }
        return result;
      })());

      for (key in attributesLeft) {
        value = attributesLeft[key];
        if ((value === attributes[key]) || Array.from(inheritableAttributes).includes(key)) {
          commonAttributes[key] = value;
        }
      }

      return commonAttributes;
    }

    getRangeOfCommonAttributeAtPosition(attributeName, position) {
      const {index, offset} = this.locationFromPosition(position);
      const text = this.getTextAtIndex(index);
      const [startOffset, endOffset] = Array.from(text.getExpandedRangeForAttributeAtOffset(attributeName, offset));

      const start = this.positionFromLocation({index, offset: startOffset});
      const end = this.positionFromLocation({index, offset: endOffset});
      return normalizeRange([start, end]);
    }

    getBaseBlockAttributes() {
      let baseBlockAttributes = this.getBlockAtIndex(0).getAttributes();

      for (let blockIndex = 1, end = this.getBlockCount(), asc = 1 <= end; asc ? blockIndex < end : blockIndex > end; asc ? blockIndex++ : blockIndex--) {
        var blockAttributes = this.getBlockAtIndex(blockIndex).getAttributes();
        var lastAttributeIndex = Math.min(baseBlockAttributes.length, blockAttributes.length);

        baseBlockAttributes = (() => {
          const result = [];
          for (let index = 0, end1 = lastAttributeIndex, asc1 = 0 <= end1; asc1 ? index < end1 : index > end1; asc1 ? index++ : index--) {
            if (blockAttributes[index] !== baseBlockAttributes[index]) { break; }
            result.push(blockAttributes[index]);
          }
          return result;
        })();
      }

      return baseBlockAttributes;
    }

    getAttachmentById(attachmentId) {
      for (let attachment of Array.from(this.getAttachments())) { if (attachment.id === attachmentId) { return attachment; } }
    }

    getAttachmentPieces() {
      let attachmentPieces = [];
      this.blockList.eachObject(({text}) => attachmentPieces = attachmentPieces.concat(text.getAttachmentPieces()));
      return attachmentPieces;
    }

    getAttachments() {
      return Array.from(this.getAttachmentPieces()).map((piece) => piece.attachment);
    }

    getRangeOfAttachment(attachment) {
      let position = 0;
      const iterable = this.blockList.toArray();
      for (let index = 0; index < iterable.length; index++) {
        var textRange;
        const {text} = iterable[index];
        if (textRange = text.getRangeOfAttachment(attachment)) {
          return normalizeRange([position + textRange[0], position + textRange[1]]);
        }
        position += text.getLength();
      }
    }

    getLocationRangeOfAttachment(attachment) {
      const range = this.getRangeOfAttachment(attachment);
      return this.locationRangeFromRange(range);
    }

    getAttachmentPieceForAttachment(attachment) {
      for (let piece of Array.from(this.getAttachmentPieces())) { if (piece.attachment === attachment) { return piece; } }
    }

    findRangesForTextAttribute(attributeName, param) {
      if (param == null) { param = {}; }
      const {withValue} = param;
      let position = 0;
      let range = [];
      const ranges = [];

      const match = function(piece) {
        if (withValue != null) {
          return piece.getAttribute(attributeName) === withValue;
        } else {
          return piece.hasAttribute(attributeName);
        }
      };

      for (let piece of Array.from(this.getPieces())) {
        const length = piece.getLength();
        if (match(piece)) {
          if (range[1] === position) {
            range[1] = position + length;
          } else {
            ranges.push(range = [position, position + length]);
          }
        }
        position += length;
      }

      return ranges;
    }

    locationFromPosition(position) {
      const location = this.blockList.findIndexAndOffsetAtPosition(Math.max(0, position));
      if (location.index != null) {
        return location;
      } else {
        const blocks = this.getBlocks();
        return {index: blocks.length - 1, offset: blocks[blocks.length - 1].getLength()};
      }
    }

    positionFromLocation(location) {
      return this.blockList.findPositionAtIndexAndOffset(location.index, location.offset);
    }

    locationRangeFromPosition(position) {
      return normalizeRange(this.locationFromPosition(position));
    }

    locationRangeFromRange(range) {
      if (!(range = normalizeRange(range))) { return; }
      const [startPosition, endPosition] = Array.from(range);
      const startLocation = this.locationFromPosition(startPosition);
      const endLocation = this.locationFromPosition(endPosition);
      return normalizeRange([startLocation, endLocation]);
    }

    rangeFromLocationRange(locationRange) {
      let rightPosition;
      locationRange = normalizeRange(locationRange);
      const leftPosition = this.positionFromLocation(locationRange[0]);
      if (!rangeIsCollapsed(locationRange)) { rightPosition = this.positionFromLocation(locationRange[1]); }
      return normalizeRange([leftPosition, rightPosition]);
    }

    isEqualTo(document) {
      return this.blockList.isEqualTo(document != null ? document.blockList : undefined);
    }

    getTexts() {
      return Array.from(this.getBlocks()).map((block) => block.text);
    }

    getPieces() {
      const pieces = [];
      for (let text of Array.from(this.getTexts())) {
        pieces.push(...Array.from(text.getPieces() || []));
      }
      return pieces;
    }

    getObjects() {
      return this.getBlocks().concat(this.getTexts()).concat(this.getPieces());
    }

    toSerializableDocument() {
      const blocks = [];
      this.blockList.eachObject(block => blocks.push(block.copyWithText(block.text.toSerializableText())));
      return new this.constructor(blocks);
    }

    toString() {
      return this.blockList.toString();
    }

    toJSON() {
      return this.blockList.toJSON();
    }

    toConsole() {
      return JSON.stringify(Array.from(this.blockList.toArray()).map((block) => JSON.parse(block.text.toConsole())));
    }
  });
  Cls.initClass();
  return Cls;
})();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}