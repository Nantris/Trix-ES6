/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

testGroup("Trix.DocumentView", () =>
  eachFixture((name, details) =>
    test(name, () => assert.documentHTMLEqual(details.document, details.html))
  )
);
