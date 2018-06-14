/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require rangy-core
//= require rangy-textrange

const helpers = Trix.TestHelpers;

const keyCodes = {};
for (let code in Trix.InputController.keyNames) {
  const name = Trix.InputController.keyNames[code];
  keyCodes[name] = code;
}

helpers.extend({
  moveCursor(options, callback) {
    let direction, move, times;
    if (typeof options === "string") {
      direction = options;
    } else {
      ({ direction } = options);
      ({ times } = options);
    }

    if (times == null) { times = 1; }

    return (move = () => helpers.defer(function() {
      if (helpers.triggerEvent(document.activeElement, "keydown", {keyCode: keyCodes[direction]})) {
        const selection = rangy.getSelection();
        selection.move("character", direction === "right" ? 1 : -1);
        Trix.selectionChangeObserver.update();
      }

      if (--times === 0) {
        return helpers.defer(() => callback(getCursorCoordinates()));
      } else {
        return move();
      }
    }) )();
  },

  expandSelection(options, callback) { return helpers.defer(function() {
    let direction, expand, times;
    if (typeof options === "string") {
      direction = options;
    } else {
      ({ direction } = options);
      ({ times } = options);
    }

    if (times == null) { times = 1; }

    return (expand = () => helpers.defer(function() {
      if (helpers.triggerEvent(document.activeElement, "keydown", {keyCode: keyCodes[direction], shiftKey: true})) {
        getComposition().expandSelectionInDirection(direction === "left" ? "backward" : "forward");
      }

      if (--times === 0) {
        return helpers.defer(callback);
      } else {
        return expand();
      }
    }) )();
  }); },

  collapseSelection(direction, callback) {
    const selection = rangy.getSelection();
    if (direction === "left") {
      selection.collapseToStart();
    } else {
      selection.collapseToEnd();
    }
    Trix.selectionChangeObserver.update();
    return helpers.defer(callback);
  },

  selectAll(callback) {
    rangy.getSelection().selectAllChildren(document.activeElement);
    Trix.selectionChangeObserver.update();
    return helpers.defer(callback);
  },

  deleteSelection() {
    const selection = rangy.getSelection();
    selection.getRangeAt(0).deleteContents();
    return Trix.selectionChangeObserver.update();
  },

  selectionIsCollapsed() {
    return rangy.getSelection().isCollapsed;
  },

  insertNode(node, callback) {
    const selection = rangy.getSelection();
    const range = selection.getRangeAt(0);
    range.splitBoundaries();
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();
    selection.setSingleRange(range);
    Trix.selectionChangeObserver.update();
    return helpers.defer(callback);
  },

  selectNode(node, callback) {
    const selection = rangy.getSelection();
    selection.selectAllChildren(node);
    Trix.selectionChangeObserver.update();
    return (typeof callback === 'function' ? callback() : undefined);
  }
});

var getCursorCoordinates = function() {
  let rect;
  if (rect = window.getSelection().getRangeAt(0).getClientRects()[0]) {
    return {
      clientX: rect.left,
      clientY: rect.top + (rect.height / 2)
    };
  }
};
