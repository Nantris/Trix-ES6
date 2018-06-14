/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require_self

let left, left1;
const html = document.documentElement;
const match = (left = (left1 = html.matchesSelector != null ? html.matchesSelector : html.webkitMatchesSelector) != null ? left1 : html.msMatchesSelector) != null ? left : html.mozMatchesSelector;

Trix.extend({
  handleEvent(eventName, param) {
    if (param == null) { param = {}; }
    let {onElement, matchingSelector, withCallback, inPhase, preventDefault, times} = param;
    const element = onElement != null ? onElement : html;
    const selector = matchingSelector;
    const callback = withCallback;
    const useCapture = inPhase === "capturing";

    var handler = function(event) {
      if ((times != null) && (--times === 0)) { handler.destroy(); }
      const target = Trix.findClosestElementFromNode(event.target, {matchingSelector: selector});
      if (target != null) {
        if (withCallback != null) {
          withCallback.call(target, event, target);
        }
        if (preventDefault) { return event.preventDefault(); }
      }
    };

    handler.destroy = () => element.removeEventListener(eventName, handler, useCapture);

    element.addEventListener(eventName, handler, useCapture);
    return handler;
  },

  handleEventOnce(eventName, options) {
    if (options == null) { options = {}; }
    options.times = 1;
    return Trix.handleEvent(eventName, options);
  },

  triggerEvent(eventName, param) {
    if (param == null) { param = {}; }
    let {onElement, bubbles, cancelable, attributes} = param;
    const element = onElement != null ? onElement : html;
    bubbles = bubbles !== false;
    cancelable = cancelable !== false;

    const event = document.createEvent("Events");
    event.initEvent(eventName, bubbles, cancelable);
    if (attributes != null) { Trix.extend.call(event, attributes); }
    return element.dispatchEvent(event);
  },

  elementMatchesSelector(element, selector) {
    if ((element != null ? element.nodeType : undefined) === 1) {
      return match.call(element, selector);
    }
  },

  findClosestElementFromNode(node, param) {
    if (param == null) { param = {}; }
    const {matchingSelector, untilNode} = param;
    while (!(node == null) && (node.nodeType !== Node.ELEMENT_NODE)) { node = node.parentNode; }
    if (node == null) { return; }

    if (matchingSelector != null) {
      if (node.closest && (untilNode == null)) {
        return node.closest(matchingSelector);
      } else {
        while (node && (node !== untilNode)) {
          if (Trix.elementMatchesSelector(node, matchingSelector)) { return node; }
          node = node.parentNode;
        }
      }
    } else {
      return node;
    }
  },

  findInnerElement(element) {
    while (element != null ? element.firstElementChild : undefined) { element = element.firstElementChild; }
    return element;
  },

  innerElementIsActive(element) {
    return (document.activeElement !== element) && Trix.elementContainsNode(element, document.activeElement);
  },

  elementContainsNode(element, node) {
    if (!element || !node) { return; }
    while (node) {
      if (node === element) { return true; }
      node = node.parentNode;
    }
  },

  findNodeFromContainerAndOffset(container, offset) {
    if (!container) { return; }
    if (container.nodeType === Node.TEXT_NODE) {
      return container;
    } else if (offset === 0) {
      return container.firstChild != null ? container.firstChild : container;
    } else {
      return container.childNodes.item(offset - 1);
    }
  },

  findElementFromContainerAndOffset(container, offset) {
    const node = Trix.findNodeFromContainerAndOffset(container, offset);
    return Trix.findClosestElementFromNode(node);
  },

  findChildIndexOfNode(node) {
    if (!(node != null ? node.parentNode : undefined)) { return; }
    let childIndex = 0;
    while ((node = node.previousSibling)) { childIndex++; }
    return childIndex;
  },

  walkTree(tree, param) {
    if (param == null) { param = {}; }
    const {onlyNodesOfType, usingFilter, expandEntityReferences} = param;
    const whatToShow = (() => { switch (onlyNodesOfType) {
      case "element": return NodeFilter.SHOW_ELEMENT;
      case "text":    return NodeFilter.SHOW_TEXT;
      case "comment": return NodeFilter.SHOW_COMMENT;
      default: return NodeFilter.SHOW_ALL;
    } })();

    return document.createTreeWalker(tree, whatToShow, usingFilter != null ? usingFilter : null, expandEntityReferences === true);
  },

  tagName(element) {
    return __guard__(element != null ? element.tagName : undefined, x => x.toLowerCase());
  },

  makeElement(tagName, options) {
    let key, value;
    if (options == null) { options = {}; }
    if (typeof tagName === "object") {
      options = tagName;
      ({tagName} = options);
    } else {
      options = {attributes: options};
    }

    const element = document.createElement(tagName);

    if (options.editable != null) {
      if (options.attributes == null) { options.attributes = {}; }
      options.attributes.contenteditable = options.editable;
    }

    if (options.attributes) {
      for (key in options.attributes) {
        value = options.attributes[key];
        element.setAttribute(key, value);
      }
    }

    if (options.style) {
      for (key in options.style) {
        value = options.style[key];
        element.style[key] = value;
      }
    }

    if (options.data) {
      for (key in options.data) {
        value = options.data[key];
        element.dataset[key] = value;
      }
    }

    if (options.className) {
      for (let className of Array.from(options.className.split(" "))) {
        element.classList.add(className);
      }
    }

    if (options.textContent) {
      element.textContent = options.textContent;
    }

    return element;
  },

  getBlockTagNames() {
    return Trix.blockTagNames != null ? Trix.blockTagNames : (Trix.blockTagNames = ((() => {
      const result = [];
      for (let key in Trix.config.blockAttributes) {
        const value = Trix.config.blockAttributes[key];
        result.push(value.tagName);
      }
      return result;
    })()));
  },

  nodeIsBlockContainer(node) {
    return Trix.nodeIsBlockStartComment(node != null ? node.firstChild : undefined);
  },

  nodeProbablyIsBlockContainer(node) {
    let needle, needle1;
    return (needle = Trix.tagName(node), Array.from(Trix.getBlockTagNames()).includes(needle)) &&
      (needle1 = Trix.tagName(node.firstChild), !Array.from(Trix.getBlockTagNames()).includes(needle1));
  },

  nodeIsBlockStart(node, param) {
    if (param == null) { param = {strict: true}; }
    const {strict} = param;
    if (strict) {
      return Trix.nodeIsBlockStartComment(node);
    } else {
      return Trix.nodeIsBlockStartComment(node) ||
        (!Trix.nodeIsBlockStartComment(node.firstChild) && Trix.nodeProbablyIsBlockContainer(node));
    }
  },

  nodeIsBlockStartComment(node) {
    return Trix.nodeIsCommentNode(node) && ((node != null ? node.data : undefined) === "block");
  },

  nodeIsCommentNode(node) {
    return (node != null ? node.nodeType : undefined) === Node.COMMENT_NODE;
  },

  nodeIsCursorTarget(node) {
    if (!node) { return; }
    if (Trix.nodeIsTextNode(node)) {
      return node.data === Trix.ZERO_WIDTH_SPACE;
    } else {
      return Trix.nodeIsCursorTarget(node.firstChild);
    }
  },

  nodeIsAttachmentElement(node) {
    return Trix.elementMatchesSelector(node, Trix.AttachmentView.attachmentSelector);
  },

  nodeIsEmptyTextNode(node) {
    return Trix.nodeIsTextNode(node) && ((node != null ? node.data : undefined) === "");
  },

  nodeIsTextNode(node) {
    return (node != null ? node.nodeType : undefined) === Node.TEXT_NODE;
  }
});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}