/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

testGroup("Trix.Block", function() {
  test("consolidating blocks creates text with one blockBreak piece", function() {
    const blockA = new Trix.Block(Trix.Text.textForStringWithAttributes("a"));
    const blockB = new Trix.Block(Trix.Text.textForStringWithAttributes("b"));
    const consolidatedBlock = blockA.consolidateWith(blockB);
    const pieces = consolidatedBlock.text.getPieces();

    assert.equal(pieces.length, 2, JSON.stringify(pieces));
    assert.deepEqual(pieces[0].getAttributes(), {});
    assert.deepEqual(pieces[1].getAttributes(), { blockBreak: true });
    return assert.equal(consolidatedBlock.toString(), "a\nb\n");
  });

  return test("consolidating empty blocks creates text with one blockBreak piece", function() {
    const consolidatedBlock = new Trix.Block().consolidateWith(new Trix.Block);
    const pieces = consolidatedBlock.text.getPieces();

    assert.equal(pieces.length, 2, JSON.stringify(pieces));
    assert.deepEqual(pieces[0].getAttributes(), {});
    assert.deepEqual(pieces[1].getAttributes(), { blockBreak: true });
    return assert.equal(consolidatedBlock.toString(), "\n\n");
  });
});
