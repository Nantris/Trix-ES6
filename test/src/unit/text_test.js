/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

testGroup("Trix.Text", () =>
  testGroup("#removeTextAtRange", function() {
    test("removes text with range in single piece", function() {
      const text = new Trix.Text([new Trix.StringPiece("abc")]);
      const pieces = text.removeTextAtRange([0,1]).getPieces();
      assert.equal(pieces.length, 1);
      assert.equal(pieces[0].toString(), "bc");
      return assert.deepEqual(pieces[0].getAttributes(), {});
  });

    return test("removes text with range spanning pieces", function() {
      const text = new Trix.Text([new Trix.StringPiece("abc"), new Trix.StringPiece("123", {bold: true})]);
      const pieces = text.removeTextAtRange([2,4]).getPieces();
      assert.equal(pieces.length, 2);
      assert.equal(pieces[0].toString(), "ab");
      assert.deepEqual(pieces[0].getAttributes(), {});
      assert.equal(pieces[1].toString(), "23");
      return assert.deepEqual(pieces[1].getAttributes(), {bold: true});
    });
  })
);
