/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS201: Simplify complex destructure assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/text

const {arraysAreEqual, spliceArray, getBlockConfig, getBlockAttributeNames, getListAttributeNames} = Trix;

(function() {
  let applyBlockBreakToText = undefined;
  let unmarkExistingInnerBlockBreaksInText = undefined;
  let blockBreakText = undefined;
  let addBlockBreakToText = undefined;
  let textEndsInBlockBreak = undefined;
  let unmarkBlockBreakPiece = undefined;
  let expandAttribute = undefined;
  let getLastElement = undefined;
  let removeLastValue = undefined;
  const Cls = (Trix.Block = class Block extends Trix.Object {
    static initClass() {
  
      // Block breaks
  
      applyBlockBreakToText = function(text) {
        text = unmarkExistingInnerBlockBreaksInText(text);
        text = addBlockBreakToText(text);
        return text;
      };
  
      unmarkExistingInnerBlockBreaksInText = function(text) {
        let modified;
        modified = false;
        let array = text.getPieces(),
          adjustedLength = Math.max(array.length, 1),
          innerPieces = array.slice(0, adjustedLength - 1),
          lastPiece = array[adjustedLength - 1];
        if (lastPiece == null) { return text; }
  
        innerPieces = (() => {
          const result = [];
          for (let piece of Array.from(innerPieces)) {
            if (piece.isBlockBreak()) {
              modified = true;
              result.push(unmarkBlockBreakPiece(piece));
            } else {
              result.push(piece);
            }
          }
          return result;
        })();
  
        if (modified) {
          return new Trix.Text([...Array.from(innerPieces), lastPiece]);
        } else {
          return text;
        }
      };
  
      blockBreakText = Trix.Text.textForStringWithAttributes("\n", {blockBreak: true});
  
      addBlockBreakToText = function(text) {
        if (textEndsInBlockBreak(text)) {
          return text;
        } else {
          return text.appendText(blockBreakText);
        }
      };
  
      textEndsInBlockBreak = function(text) {
        const length = text.getLength();
        if (length === 0) { return false; }
        const endText = text.getTextAtRange([length - 1, length]);
        return endText.isBlockBreak();
      };
  
      unmarkBlockBreakPiece = piece => piece.copyWithoutAttribute("blockBreak");
  
      // Attributes
  
      expandAttribute = function(attribute) {
        const {listAttribute} = getBlockConfig(attribute);
        if (listAttribute != null) {
          return [listAttribute, attribute];
        } else {
          return [attribute];
        }
      };
  
      // Array helpers
  
      getLastElement = array => array.slice(-1)[0];
  
      removeLastValue = function(array, value) {
        const index = array.lastIndexOf(value);
        if (index === -1) {
          return array;
        } else {
          return spliceArray(array, index, 1);
        }
      };
    }
    static fromJSON(blockJSON) {
      const text = Trix.Text.fromJSON(blockJSON.text);
      return new (this)(text, blockJSON.attributes);
    }

    constructor(text, attributes) {
      if (text == null) { text = new Trix.Text; }
      if (attributes == null) { attributes = []; }
      super(...arguments);
      this.text = applyBlockBreakToText(text);
      this.attributes = attributes;
    }

    isEmpty() {
      return this.text.isBlockBreak();
    }

    isEqualTo(block) {
      return super.isEqualTo(...arguments) || (
        this.text.isEqualTo(block != null ? block.text : undefined) &&
        arraysAreEqual(this.attributes, block != null ? block.attributes : undefined)
      );
    }

    copyWithText(text) {
      return new this.constructor(text, this.attributes);
    }

    copyWithoutText() {
      return this.copyWithText(null);
    }

    copyWithAttributes(attributes) {
      return new this.constructor(this.text, attributes);
    }

    copyUsingObjectMap(objectMap) {
      let mappedText;
      if ((mappedText = objectMap.find(this.text))) {
        return this.copyWithText(mappedText);
      } else {
        return this.copyWithText(this.text.copyUsingObjectMap(objectMap));
      }
    }

    addAttribute(attribute) {
      const attributes = this.attributes.concat(expandAttribute(attribute));
      return this.copyWithAttributes(attributes);
    }

    removeAttribute(attribute) {
      const {listAttribute} = getBlockConfig(attribute);
      const attributes = removeLastValue(removeLastValue(this.attributes, attribute), listAttribute);
      return this.copyWithAttributes(attributes);
    }

    removeLastAttribute() {
      return this.removeAttribute(this.getLastAttribute());
    }

    getLastAttribute() {
      return getLastElement(this.attributes);
    }

    getAttributes() {
      return this.attributes.slice(0);
    }

    getAttributeLevel() {
      return this.attributes.length;
    }

    getAttributeAtLevel(level) {
      return this.attributes[level - 1];
    }

    hasAttributes() {
      return this.getAttributeLevel() > 0;
    }

    getLastNestableAttribute() {
      return getLastElement(this.getNestableAttributes());
    }

    getNestableAttributes() {
      return (() => {
        const result = [];
        for (let attribute of Array.from(this.attributes)) {           if (getBlockConfig(attribute).nestable) {
            result.push(attribute);
          }
        }
        return result;
      })();
    }

    getNestingLevel() {
      return this.getNestableAttributes().length;
    }

    decreaseNestingLevel() {
      let attribute;
      if ((attribute = this.getLastNestableAttribute())) {
        return this.removeAttribute(attribute);
      } else {
        return this;
      }
    }

    increaseNestingLevel() {
      let attribute;
      if (attribute = this.getLastNestableAttribute()) {
        const index = this.attributes.lastIndexOf(attribute);
        const attributes = spliceArray(this.attributes, index + 1, 0, ...Array.from(expandAttribute(attribute)));
        return this.copyWithAttributes(attributes);
      } else {
        return this;
      }
    }

    getListItemAttributes() {
      return (() => {
        const result = [];
        for (let attribute of Array.from(this.attributes)) {           if (getBlockConfig(attribute).listAttribute) {
            result.push(attribute);
          }
        }
        return result;
      })();
    }

    isListItem() {
      return __guard__(getBlockConfig(this.getLastAttribute()), x => x.listAttribute);
    }

    isTerminalBlock() {
      return __guard__(getBlockConfig(this.getLastAttribute()), x => x.terminal);
    }

    breaksOnReturn() {
      return __guard__(getBlockConfig(this.getLastAttribute()), x => x.breakOnReturn);
    }

    findLineBreakInDirectionFromPosition(direction, position) {
      const string = this.toString();
      const result = (() => { switch (direction) {
        case "forward":
          return string.indexOf("\n", position);
        case "backward":
          return string.slice(0, position).lastIndexOf("\n");
      } })();

      if (result !== -1) { return result; }
    }

    contentsForInspection() {
      return {
        text: this.text.inspect(),
        attributes: this.attributes
      };
    }

    toString() {
      return this.text.toString();
    }

    toJSON() {
      return {
        text: this.text,
        attributes: this.attributes
      };
    }

    // Splittable

    getLength() {
      return this.text.getLength();
    }

    canBeConsolidatedWith(block) {
      return !this.hasAttributes() && !block.hasAttributes();
    }

    consolidateWith(block) {
      const newlineText = Trix.Text.textForStringWithAttributes("\n");
      const text = this.getTextWithoutBlockBreak().appendText(newlineText);
      return this.copyWithText(text.appendText(block.text));
    }

    splitAtOffset(offset) {
      let left, right;
      if (offset === 0) {
        left = null;
        right = this;
      } else if (offset === this.getLength()) {
        left = this;
        right = null;
      } else {
        left = this.copyWithText(this.text.getTextAtRange([0, offset]));
        right = this.copyWithText(this.text.getTextAtRange([offset, this.getLength()]));
      }
      return [left, right];
    }

    getBlockBreakPosition() {
      return this.text.getLength() - 1;
    }

    getTextWithoutBlockBreak() {
      if (textEndsInBlockBreak(this.text)) {
        return this.text.getTextAtRange([0, this.getBlockBreakPosition()]);
      } else {
        return this.text.copy();
      }
    }

    // Grouping

    canBeGrouped(depth) {
      return this.attributes[depth];
    }

    canBeGroupedWith(otherBlock, depth) {
      let needle;
      const otherAttributes = otherBlock.getAttributes();
      const otherAttribute = otherAttributes[depth];
      const attribute = this.attributes[depth];

      return (attribute === otherAttribute) &&
        !((getBlockConfig(attribute).group === false) &&
             (needle = otherAttributes[depth + 1], !Array.from(getListAttributeNames()).includes(needle)));
    }
  });
  Cls.initClass();
  return Cls;
})();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}