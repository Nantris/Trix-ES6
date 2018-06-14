/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

let composition = null;
const setup = function() {
  composition = new Trix.Composition;
  return composition.delegate = new Trix.TestCompositionDelegate;
};

testGroup("Trix.Composition", {setup}, () =>
  test("deleteInDirection respects UTF-16 character boundaries", function() {
    composition.insertString("abc😭");
    composition.deleteInDirection("backward");
    composition.insertString("d");
    return assert.equal(composition.document.toString(), "abcd\n");
  })
);
