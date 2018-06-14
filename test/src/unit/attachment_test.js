/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, test, testGroup} = Trix.TestHelpers;

testGroup("Trix.Attachment", function() {
  const previewableTypes = "image image/gif image/png image/jpg".split(" ");
  const nonPreviewableTypes = "image/tiff application/foo".split(" ");

  const createAttachment = attributes => new Trix.Attachment(attributes);

  for (var contentType of Array.from(previewableTypes)) { (contentType =>
    test(`${contentType} content type is previewable`, () => assert.ok(createAttachment({contentType}).isPreviewable()))
  )(contentType); }

  for (contentType of Array.from(nonPreviewableTypes)) { (contentType =>
    test(`${contentType} content type is NOT previewable`, () => assert.notOk(createAttachment({contentType}).isPreviewable()))
  )(contentType); }

  return test("'previewable' attribute determines previewability", function() {
    let attrs = {previewable: true, contentType: nonPreviewableTypes[0]};
    assert.ok(createAttachment(attrs).isPreviewable());

    attrs = {previewable: false, contentType: previewableTypes[0]};
    return assert.notOk(createAttachment(attrs).isPreviewable());
  });
});
