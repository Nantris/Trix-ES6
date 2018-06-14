/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.extend({
  getDOMSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) { return selection; }
  },

  getDOMRange() {
    let domRange;
    if (domRange = __guard__(Trix.getDOMSelection(), x => x.getRangeAt(0))) {
      if (!domRangeIsPrivate(domRange)) {
        return domRange;
      }
    }
  },

  setDOMRange(domRange) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(domRange);
    return Trix.selectionChangeObserver.update();
  }
});

// In Firefox, clicking certain <input> elements changes the selection to a
// private element used to draw its UI. Attempting to access properties of those
// elements throws an error.
// https://bugzilla.mozilla.org/show_bug.cgi?id=208427
var domRangeIsPrivate = domRange => nodeIsPrivate(domRange.startContainer) || nodeIsPrivate(domRange.endContainer);

var nodeIsPrivate = node => !Object.getPrototypeOf(node);

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}