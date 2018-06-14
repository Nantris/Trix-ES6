/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {normalizeRange, rangesAreEqual} = Trix;

const helpers = Trix.TestHelpers;
helpers.assert = QUnit.assert;

helpers.assert.locationRange = function(start, end) {
  const expectedLocationRange = normalizeRange([start, end]);
  const actualLocationRange = getEditorController().getLocationRange();
  return this.deepEqual(actualLocationRange, expectedLocationRange);
};

helpers.assert.selectedRange = function(range) {
  const expectedRange = normalizeRange(range);
  const actualRange = getEditor().getSelectedRange();
  return this.deepEqual(actualRange, expectedRange);
};

helpers.assert.textAttributes = function(range, attributes) {
  const document = getDocument().getDocumentAtRange(range);
  const blocks = document.getBlocks();
  if (blocks.length !== 1) { throw `range ${JSON.stringify(range)} spans more than one block`; }

  const locationRange = getDocument().locationRangeFromRange(range);
  const textIndex = locationRange[0].index;
  const textRange = [locationRange[0].offset, locationRange[1].offset];
  const text = getDocument().getTextAtIndex(textIndex).getTextAtRange(textRange);
  const pieces = text.getPieces();
  if (pieces.length !== 1) { throw `range ${JSON.stringify(range)} must only span one piece`; }

  const piece = pieces[0];
  return this.deepEqual(piece.getAttributes(), attributes);
};

helpers.assert.blockAttributes = function(range, attributes) {
  const document = getDocument().getDocumentAtRange(range);
  const blocks = document.getBlocks();
  if (blocks.length !== 1) { throw `range ${JSON.stringify(range)} spans more than one block`; }

  const block = blocks[0];
  return this.deepEqual(block.getAttributes(), attributes);
};

helpers.assert.documentHTMLEqual = function(trixDocument, html) {
  return this.equal(helpers.getHTML(trixDocument), html);
};

helpers.getHTML = trixDocument => Trix.DocumentView.render(trixDocument).innerHTML;
