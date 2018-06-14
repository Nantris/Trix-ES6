/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

testGroup("Trix.serializeToContentType", () =>
  eachFixture(function(name, details) {
    if (details.serializedHTML) {
      return test(name, () => assert.equal(Trix.serializeToContentType(details.document, "text/html"), details.serializedHTML));
    }
  })
);
