/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {elementContainsNode, findChildIndexOfNode, nodeIsBlockStart,
 nodeIsBlockStartComment, nodeIsBlockContainer, nodeIsCursorTarget,
 nodeIsEmptyTextNode, nodeIsTextNode, nodeIsAttachmentElement, tagName, walkTree} = Trix;

(function() {
  let nodeLength = undefined;
  let acceptSignificantNodes = undefined;
  let rejectEmptyTextNodes = undefined;
  let rejectAttachmentContents = undefined;
  const Cls = (Trix.LocationMapper = class LocationMapper {
    static initClass() {
  
      nodeLength = function(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (nodeIsCursorTarget(node)) {
            return 0;
          } else {
            const string = node.textContent;
            return string.length;
          }
        } else if ((tagName(node) === "br") || nodeIsAttachmentElement(node)) {
          return 1;
        } else {
          return 0;
        }
      };
  
      acceptSignificantNodes = function(node) {
        if (rejectEmptyTextNodes(node) === NodeFilter.FILTER_ACCEPT) {
          return rejectAttachmentContents(node);
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      };
  
      rejectEmptyTextNodes = function(node) {
        if (nodeIsEmptyTextNode(node)) {
          return NodeFilter.FILTER_REJECT;
        } else {
          return NodeFilter.FILTER_ACCEPT;
        }
      };
  
      rejectAttachmentContents = function(node) {
        if (nodeIsAttachmentElement(node.parentNode)) {
          return NodeFilter.FILTER_REJECT;
        } else {
          return NodeFilter.FILTER_ACCEPT;
        }
      };
    }
    constructor(element) {
      this.element = element;
    }

    findLocationFromContainerAndOffset(container, offset, param) {
      let attachmentElement;
      if (param == null) { param = {strict: true}; }
      const {strict} = param;
      let childIndex = 0;
      let foundBlock = false;
      const location = {index: 0, offset: 0};

      if (attachmentElement = this.findAttachmentElementParentForNode(container)) {
        container = attachmentElement.parentNode;
        offset = findChildIndexOfNode(attachmentElement);
      }

      const walker = walkTree(this.element, {usingFilter: rejectAttachmentContents});

      while (walker.nextNode()) {
        const node = walker.currentNode;

        if ((node === container) && nodeIsTextNode(container)) {
          if (!nodeIsCursorTarget(node)) {
            location.offset += offset;
          }
          break;

        } else {
          if (node.parentNode === container) {
            if (childIndex++ === offset) { break; }
          } else if (!elementContainsNode(container, node)) {
            if (childIndex > 0) { break; }
          }

          if (nodeIsBlockStart(node, {strict})) {
            if (foundBlock) { location.index++; }
            location.offset = 0;
            foundBlock = true;
          } else {
            location.offset += nodeLength(node);
          }
        }
      }

      return location;
    }

    findContainerAndOffsetFromLocation(location) {
      let container, offset;
      if ((location.index === 0) && (location.offset === 0)) {
        container = this.element;
        offset = 0;

        while (container.firstChild) {
          container = container.firstChild;
          if (nodeIsBlockContainer(container)) {
            offset = 1;
            break;
          }
        }

        return [container, offset];
      }

      let [node, nodeOffset] = Array.from(this.findNodeAndOffsetFromLocation(location));
      if (!node) { return; }

      if (nodeIsTextNode(node)) {
        container = node;
        const string = node.textContent;
        offset = location.offset - nodeOffset;

      } else {
        container = node.parentNode;

        if (!nodeIsBlockStart(node.previousSibling)) {
          if (!nodeIsBlockContainer(container)) {
            while (node === container.lastChild) {
              node = container;
              container = container.parentNode;
              if (nodeIsBlockContainer(container)) { break; }
            }
          }
        }

        offset = findChildIndexOfNode(node);
        if (location.offset !== 0) { offset++; }
      }

      return [container, offset];
    }

    findNodeAndOffsetFromLocation(location) {
      let node, nodeOffset;
      let offset = 0;

      for (let currentNode of Array.from(this.getSignificantNodesForIndex(location.index))) {
        const length = nodeLength(currentNode);

        if (location.offset <= (offset + length)) {
          if (nodeIsTextNode(currentNode)) {
            node = currentNode;
            nodeOffset = offset;
            if ((location.offset === nodeOffset) && nodeIsCursorTarget(node)) { break; }

          } else if (!node) {
            node = currentNode;
            nodeOffset = offset;
          }
        }

        offset += length;
        if (offset > location.offset) { break; }
      }

      return [node, nodeOffset];
    }

    // Private

    findAttachmentElementParentForNode(node) {
      while (node && (node !== this.element)) {
        if (nodeIsAttachmentElement(node)) { return node; }
        node = node.parentNode;
      }
    }

    getSignificantNodesForIndex(index) {
      const nodes = [];
      const walker = walkTree(this.element, {usingFilter: acceptSignificantNodes});
      let recordingNodes = false;

      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (nodeIsBlockStartComment(node)) {
          var blockIndex;
          if (blockIndex != null) {
            blockIndex++;
          } else {
            blockIndex = 0;
          }

          if (blockIndex === index) {
            recordingNodes = true;
          } else if (recordingNodes) {
            break;
          }
        } else if (recordingNodes) {
          nodes.push(node);
        }
      }

      return nodes;
    }
  });
  Cls.initClass();
  return Cls;
})();
