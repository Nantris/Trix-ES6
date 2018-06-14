/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {findClosestElementFromNode, nodeIsEmptyTextNode, nodeIsBlockStartComment, normalizeSpaces, summarizeStringChange, tagName} = Trix;

(function() {
  let mutableAttributeName = undefined;
  let mutableSelector = undefined;
  let options = undefined;
  let getTextForNodes = undefined;
  const Cls = (Trix.MutationObserver = class MutationObserver extends Trix.BasicObject {
    static initClass() {
      mutableAttributeName = "data-trix-mutable";
      mutableSelector = `[${mutableAttributeName}]`;
  
      options = {
        attributes: true,
        childList: true,
        characterData: true,
        characterDataOldValue: true,
        subtree: true
      };
  
      getTextForNodes = function(nodes) {
        if (nodes == null) { nodes = []; }
        const text = [];
        for (let node of Array.from(nodes)) {
          switch (node.nodeType) {
            case Node.TEXT_NODE:
              text.push(node.data);
              break;
            case Node.ELEMENT_NODE:
              if (tagName(node) === "br") {
                text.push("\n");
              } else {
                text.push(...Array.from(getTextForNodes(node.childNodes) || []));
              }
              break;
          }
        }
        return text;
      };
    }

    constructor(element) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.didMutate = this.didMutate.bind(this);
      this.element = element;
      this.observer = new window.MutationObserver(this.didMutate);
      this.start();
    }

    start() {
      this.reset();
      return this.observer.observe(this.element, options);
    }

    stop() {
      return this.observer.disconnect();
    }

    didMutate(mutations) {
      this.mutations.push(...Array.from(this.findSignificantMutations(mutations) || []));

      if (this.mutations.length) {
        __guardMethod__(this.delegate, 'elementDidMutate', o => o.elementDidMutate(this.getMutationSummary()));
        return this.reset();
      }
    }

    // Private

    reset() {
      return this.mutations = [];
    }

    findSignificantMutations(mutations) {
      return (() => {
        const result = [];
        for (let mutation of Array.from(mutations)) {           if (this.mutationIsSignificant(mutation)) {
            result.push(mutation);
          }
        }
        return result;
      })();
    }

    mutationIsSignificant(mutation) {
      for (let node of Array.from(this.nodesModifiedByMutation(mutation))) { if (this.nodeIsSignificant(node)) { return true; } }
      return false;
    }

    nodeIsSignificant(node) {
      return (node !== this.element) && !this.nodeIsMutable(node) && !nodeIsEmptyTextNode(node);
    }

    nodeIsMutable(node) {
      return findClosestElementFromNode(node, {matchingSelector: mutableSelector});
    }

    nodesModifiedByMutation(mutation) {
      const nodes = [];
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName !== mutableAttributeName) {
            nodes.push(mutation.target);
          }
          break;
        case "characterData":
          // Changes to text nodes should consider the parent element
          nodes.push(mutation.target.parentNode);
          nodes.push(mutation.target);
          break;
        case "childList":
          // Consider each added or removed node
          nodes.push(...Array.from(mutation.addedNodes || []));
          nodes.push(...Array.from(mutation.removedNodes || []));
          break;
      }
      return nodes;
    }

    getMutationSummary() {
      return this.getTextMutationSummary();
    }

    getTextMutationSummary() {
      let added, deleted;
      const {additions, deletions} = this.getTextChangesFromCharacterData();

      const textChanges = this.getTextChangesFromChildList();
      for (let addition of Array.from(textChanges.additions)) { if (!Array.from(additions).includes(addition)) { additions.push(addition); } }
      deletions.push(...Array.from(textChanges.deletions || []));

      const summary = {};
      if (added = additions.join("")) { summary.textAdded = added; }
      if (deleted = deletions.join("")) { summary.textDeleted = deleted; }
      return summary;
    }

    getMutationsByType(type) {
      return Array.from(this.mutations).filter((mutation) => mutation.type === type);
    }

    getTextChangesFromChildList() {
      let textAdded, textRemoved;
      let index, text;
      const addedNodes = [];
      const removedNodes = [];

      for (let mutation of Array.from(this.getMutationsByType("childList"))) {
        addedNodes.push(...Array.from(mutation.addedNodes || []));
        removedNodes.push(...Array.from(mutation.removedNodes || []));
      }

      const singleBlockCommentRemoved =
        (addedNodes.length === 0) &&
          (removedNodes.length === 1) &&
          nodeIsBlockStartComment(removedNodes[0]);

      if (singleBlockCommentRemoved) {
        textAdded = [];
        textRemoved = ["\n"];
      } else {
        textAdded = getTextForNodes(addedNodes);
        textRemoved = getTextForNodes(removedNodes);
      }

      return {
        additions: (((() => {
          const result = [];
          for (index = 0; index < textAdded.length; index++) {
            text = textAdded[index];
            if (text !== textRemoved[index]) {
              result.push(normalizeSpaces(text));
            }
          }
          return result;
        })())),
        deletions: (((() => {
          const result1 = [];
          for (index = 0; index < textRemoved.length; index++) {
            text = textRemoved[index];
            if (text !== textAdded[index]) {
              result1.push(normalizeSpaces(text));
            }
          }
          return result1;
        })()))
      };
    }

    getTextChangesFromCharacterData() {
      let added, removed;
      const characterMutations = this.getMutationsByType("characterData");

      if (characterMutations.length) {
        const startMutation = characterMutations[0],
          endMutation = characterMutations[characterMutations.length - 1];

        const oldString = normalizeSpaces(startMutation.oldValue);
        const newString = normalizeSpaces(endMutation.target.data);
        ({added, removed} = summarizeStringChange(oldString, newString));
      }

      return {
        additions: added ? [added] : [],
        deletions: removed ? [removed] : []
      };
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