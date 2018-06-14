/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/html_sanitizer

const {arraysAreEqual, makeElement, tagName, getBlockTagNames, walkTree,
 findClosestElementFromNode, elementContainsNode, nodeIsAttachmentElement,
 normalizeSpaces, breakableWhitespacePattern, squishBreakableWhitespace} = Trix;

(function() {
  let nodeFilter = undefined;
  let pieceForString = undefined;
  let pieceForAttachment = undefined;
  let blockForAttributes = undefined;
  let getAttachmentAttributes = undefined;
  let getImageDimensions = undefined;
  let elementCanDisplayPreformattedText = undefined;
  let nodeEndsWithNonWhitespace = undefined;
  let getBlockElementMargin = undefined;
  let leftTrimBreakableWhitespace = undefined;
  let stringIsAllBreakableWhitespace = undefined;
  let stringEndsWithWhitespace = undefined;
  const Cls = (Trix.HTMLParser = class HTMLParser extends Trix.BasicObject {
    static initClass() {
  
      nodeFilter = function(node) {
        if (tagName(node) === "style") {
          return NodeFilter.FILTER_REJECT;
        } else {
          return NodeFilter.FILTER_ACCEPT;
        }
      };
  
      pieceForString = function(string, attributes) {
        if (attributes == null) { attributes = {}; }
        const type = "string";
        string = normalizeSpaces(string);
        return {string, attributes, type};
      };
  
      pieceForAttachment = function(attachment, attributes) {
        if (attributes == null) { attributes = {}; }
        const type = "attachment";
        return {attachment, attributes, type};
      };
  
      blockForAttributes = function(attributes) {
        if (attributes == null) { attributes = {}; }
        const text = [];
        return {text, attributes};
      };
  
      getAttachmentAttributes = element => JSON.parse(element.getAttribute("data-trix-attachment"));
  
      getImageDimensions = function(element) {
        const width = element.getAttribute("width");
        const height = element.getAttribute("height");
        const dimensions = {};
        if (width) { dimensions.width = parseInt(width, 10); }
        if (height) { dimensions.height = parseInt(height, 10); }
        return dimensions;
      };
  
      elementCanDisplayPreformattedText = function(element) {
        const {whiteSpace} = window.getComputedStyle(element);
        return ["pre", "pre-wrap", "pre-line"].includes(whiteSpace);
      };
  
      nodeEndsWithNonWhitespace = node => node && !stringEndsWithWhitespace(node.textContent);
  
      getBlockElementMargin = function(element) {
        const style = window.getComputedStyle(element);
        if (style.display === "block") {
          return {top: parseInt(style.marginTop), bottom: parseInt(style.marginBottom)};
        }
      };
  
      // Whitespace
  
      leftTrimBreakableWhitespace = string => string.replace(new RegExp(`^${breakableWhitespacePattern.source}+`), "");
  
      stringIsAllBreakableWhitespace = string => new RegExp(`^${breakableWhitespacePattern.source}*$`).test(string);
  
      stringEndsWithWhitespace = string => /\s$/.test(string);
    }
    static parse(html, options) {
      const parser = new (this)(html, options);
      parser.parse();
      return parser;
    }

    constructor(html, param) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.html = html;
      if (param == null) { param = {}; }
      const {referenceElement} = param;
      this.referenceElement = referenceElement;
      this.blocks = [];
      this.blockElements = [];
      this.processedElements = [];
    }

    getDocument() {
      return Trix.Document.fromJSON(this.blocks);
    }

    // HTML parsing

    parse() {
      try {
        this.createHiddenContainer();
        const html = Trix.HTMLSanitizer.sanitize(this.html).getHTML();
        this.containerElement.innerHTML = html;
        const walker = walkTree(this.containerElement, {usingFilter: nodeFilter});
        while (walker.nextNode()) { this.processNode(walker.currentNode); }
        return this.translateBlockElementMarginsToNewlines();
      } finally {
        this.removeHiddenContainer();
      }
    }

    createHiddenContainer() {
      if (this.referenceElement) {
        this.containerElement = this.referenceElement.cloneNode(false);
        this.containerElement.removeAttribute("id");
        this.containerElement.setAttribute("data-trix-internal", "");
        this.containerElement.style.display = "none";
        return this.referenceElement.parentNode.insertBefore(this.containerElement, this.referenceElement.nextSibling);
      } else {
        this.containerElement = makeElement({tagName: "div", style: { display: "none" }});
        return document.body.appendChild(this.containerElement);
      }
    }

    removeHiddenContainer() {
      return this.containerElement.parentNode.removeChild(this.containerElement);
    }

    processNode(node) {
      switch (node.nodeType) {
        case Node.TEXT_NODE:
          return this.processTextNode(node);
        case Node.ELEMENT_NODE:
          this.appendBlockForElement(node);
          return this.processElement(node);
      }
    }

    appendBlockForElement(element) {
      const elementIsBlockElement = this.isBlockElement(element);
      const currentBlockContainsElement = elementContainsNode(this.currentBlockElement, element);

      if (elementIsBlockElement && !this.isBlockElement(element.firstChild)) {
        if (!this.isInsignificantTextNode(element.firstChild) || !this.isBlockElement(element.firstElementChild)) {
          const attributes = this.getBlockAttributes(element);
          if (!currentBlockContainsElement || !arraysAreEqual(attributes, this.currentBlock.attributes)) {
            this.currentBlock = this.appendBlockForAttributesWithElement(attributes, element);
            return this.currentBlockElement = element;
          }
        }

      } else if (this.currentBlockElement && !currentBlockContainsElement && !elementIsBlockElement) {
        let parentBlockElement;
        if (parentBlockElement = this.findParentBlockElement(element)) {
          return this.appendBlockForElement(parentBlockElement);
        } else {
          this.currentBlock = this.appendEmptyBlock();
          return this.currentBlockElement = null;
        }
      }
    }

    findParentBlockElement(element) {
      let {parentElement} = element;
      while (parentElement && (parentElement !== this.containerElement)) {
        if (this.isBlockElement(parentElement) && Array.from(this.blockElements).includes(parentElement)) {
          return parentElement;
        } else {
          ({parentElement} = parentElement);
        }
      }
      return null;
    }

    processTextNode(node) {
      if (!this.isInsignificantTextNode(node)) {
        let string = node.data;
        if (!elementCanDisplayPreformattedText(node.parentNode)) {
          string = squishBreakableWhitespace(string);
          if (stringEndsWithWhitespace(node.previousSibling != null ? node.previousSibling.textContent : undefined)) {
            string = leftTrimBreakableWhitespace(string);
          }
        }
        return this.appendStringWithAttributes(string, this.getTextAttributes(node.parentNode));
      }
    }

    processElement(element) {
      let attributes;
      if (nodeIsAttachmentElement(element)) {
        attributes = getAttachmentAttributes(element);
        if (Object.keys(attributes).length) {
          const textAttributes = this.getTextAttributes(element);
          this.appendAttachmentWithAttributes(attributes, textAttributes);
          // We have everything we need so avoid processing inner nodes
          element.innerHTML = "";
        }
        return this.processedElements.push(element);
      } else {
        switch (tagName(element)) {
          case "br":
            if (!this.isExtraBR(element) && !this.isBlockElement(element.nextSibling)) {
              this.appendStringWithAttributes("\n", this.getTextAttributes(element));
            }
            return this.processedElements.push(element);
          case "img":
            attributes = {url: element.getAttribute("src"), contentType: "image"};
            var object = getImageDimensions(element);
            for (let key in object) { const value = object[key]; attributes[key] = value; }
            this.appendAttachmentWithAttributes(attributes, this.getTextAttributes(element));
            return this.processedElements.push(element);
          case "tr":
            if (element.parentNode.firstChild !== element) {
              return this.appendStringWithAttributes("\n");
            }
            break;
          case "td":
            if (element.parentNode.firstChild !== element) {
              return this.appendStringWithAttributes(" | ");
            }
            break;
        }
      }
    }

    // Document construction

    appendBlockForAttributesWithElement(attributes, element) {
      this.blockElements.push(element);
      const block = blockForAttributes(attributes);
      this.blocks.push(block);
      return block;
    }

    appendEmptyBlock() {
      return this.appendBlockForAttributesWithElement([], null);
    }

    appendStringWithAttributes(string, attributes) {
      return this.appendPiece(pieceForString(string, attributes));
    }

    appendAttachmentWithAttributes(attachment, attributes) {
      return this.appendPiece(pieceForAttachment(attachment, attributes));
    }

    appendPiece(piece) {
      if (this.blocks.length === 0) {
        this.appendEmptyBlock();
      }
      return this.blocks[this.blocks.length - 1].text.push(piece);
    }

    appendStringToTextAtIndex(string, index) {
      const {text} = this.blocks[index];
      const piece = text[text.length - 1];

      if ((piece != null ? piece.type : undefined) === "string") {
        return piece.string += string;
      } else {
        return text.push(pieceForString(string));
      }
    }

    prependStringToTextAtIndex(string, index) {
      const {text} = this.blocks[index];
      const piece = text[0];

      if ((piece != null ? piece.type : undefined) === "string") {
        return piece.string = string + piece.string;
      } else {
        return text.unshift(pieceForString(string));
      }
    }

    // Attribute parsing

    getTextAttributes(element) {
      let value;
      const attributes = {};
      for (let attribute in Trix.config.textAttributes) {
        const config = Trix.config.textAttributes[attribute];
        if (config.tagName && findClosestElementFromNode(element, {matchingSelector: config.tagName, untilNode: this.containerElement})) {
          attributes[attribute] = true;

        } else if (config.parser) {
          if (value = config.parser(element)) {
            let attributeInheritedFromBlock = false;
            for (let blockElement of Array.from(this.findBlockElementAncestors(element))) {
              if (config.parser(blockElement) === value) {
                attributeInheritedFromBlock = true;
                break;
              }
            }
            if (!attributeInheritedFromBlock) {
              attributes[attribute] = value;
            }
          }

        } else if (config.styleProperty) {
          if (value = element.style[config.styleProperty]) {
            attributes[attribute] = value;
          }
        }
      }

      if (nodeIsAttachmentElement(element)) {
        let json;
        if (json = element.getAttribute("data-trix-attributes")) {
          const object = JSON.parse(json);
          for (let key in object) {
            value = object[key];
            attributes[key] = value;
          }
        }
      }

      return attributes;
    }

    getBlockAttributes(element) {
      const attributes = [];
      while (element && (element !== this.containerElement)) {
        for (let attribute in Trix.config.blockAttributes) {
          const config = Trix.config.blockAttributes[attribute];
          if (config.parse !== false) {
            if (tagName(element) === config.tagName) {
              if ((typeof config.test === 'function' ? config.test(element) : undefined) || !config.test) {
                attributes.push(attribute);
                if (config.listAttribute) { attributes.push(config.listAttribute); }
              }
            }
          }
        }
        element = element.parentNode;
      }
      return attributes.reverse();
    }

    findBlockElementAncestors(element) {
      const ancestors = [];
      while (element && (element !== this.containerElement)) {
        var needle;
        if ((needle = tagName(element), Array.from(getBlockTagNames()).includes(needle))) {
          ancestors.push(element);
        }
        element = element.parentNode;
      }
      return ancestors;
    }

    // Element inspection

    isBlockElement(element) {
      let needle;
      if ((element != null ? element.nodeType : undefined) !== Node.ELEMENT_NODE) { return; }
      if (findClosestElementFromNode(element, {matchingSelector: "td", untilNode: this.containerElement})) { return; }
      return (needle = tagName(element), Array.from(getBlockTagNames()).includes(needle)) || (window.getComputedStyle(element).display === "block");
    }

    isInsignificantTextNode(node) {
      if ((node != null ? node.nodeType : undefined) !== Node.TEXT_NODE) { return; }
      if (!stringIsAllBreakableWhitespace(node.data)) { return; }
      const {parentNode, previousSibling, nextSibling} = node;
      if (nodeEndsWithNonWhitespace(parentNode.previousSibling) && !this.isBlockElement(parentNode.previousSibling)) { return; }
      if (elementCanDisplayPreformattedText(parentNode)) { return; }
      return !previousSibling || this.isBlockElement(previousSibling) || !nextSibling || this.isBlockElement(nextSibling);
    }

    isExtraBR(element) {
      return (tagName(element) === "br") &&
        this.isBlockElement(element.parentNode) &&
        (element.parentNode.lastChild === element);
    }

    // Margin translation

    translateBlockElementMarginsToNewlines() {
      const defaultMargin = this.getMarginOfDefaultBlockElement();

      return (() => {
        const result = [];
        for (let index = 0; index < this.blocks.length; index++) {
          var margin;
          const block = this.blocks[index];
          if ((margin = this.getMarginOfBlockElementAtIndex(index))) {
            if (margin.top > (defaultMargin.top * 2)) {
              this.prependStringToTextAtIndex("\n", index);
            }

            if (margin.bottom > (defaultMargin.bottom * 2)) {
              result.push(this.appendStringToTextAtIndex("\n", index));
            } else {
              result.push(undefined);
            }
          }
        }
        return result;
      })();
    }

    getMarginOfBlockElementAtIndex(index) {
      let element;
      if (element = this.blockElements[index]) {
        if (element.textContent) {
          let needle;
          if ((needle = tagName(element), !Array.from(getBlockTagNames()).includes(needle)) && !Array.from(this.processedElements).includes(element)) {
            return getBlockElementMargin(element);
          }
        }
      }
    }

    getMarginOfDefaultBlockElement() {
      const element = makeElement(Trix.config.blockAttributes.default.tagName);
      this.containerElement.appendChild(element);
      return getBlockElementMargin(element);
    }
  });
  Cls.initClass();
  return Cls;
})();
