/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, insertImageAttachment, test, testGroup} = Trix.TestHelpers;

testGroup("Attachment captions", {template: "editor_empty"}, function() {
  test("default caption includes file name and size", function() {
    insertImageAttachment();
    const element = getCaptionElement();
    assert.notOk(element.hasAttribute("data-trix-placeholder"));
    return assert.equal(element.textContent, "image.gif 35 Bytes");
  });

  test("caption excludes file name when configured", () =>
    withPreviewCaptionConfig({name: false, size: true}, function() {
      insertImageAttachment();
      const element = getCaptionElement();
      assert.notOk(element.hasAttribute("data-trix-placeholder"));
      return assert.equal(element.textContent, "35 Bytes");
    })
  );

  test("caption excludes file size when configured", () =>
    withPreviewCaptionConfig({name: true, size: false}, function() {
      insertImageAttachment();
      const element = getCaptionElement();
      assert.notOk(element.hasAttribute("data-trix-placeholder"));
      return assert.equal(element.textContent, "image.gif");
    })
  );

  return test("caption is empty when configured", () =>
    withPreviewCaptionConfig({name: false, size: false}, function() {
      insertImageAttachment();
      const element = getCaptionElement();
      assert.ok(element.hasAttribute("data-trix-placeholder"));
      assert.equal(element.getAttribute("data-trix-placeholder"), Trix.config.lang.captionPlaceholder);
      return assert.equal(element.textContent, "");
    })
  );
});

var withPreviewCaptionConfig = function(config, fn) {
  if (config == null) { config = {}; }
  const {caption} = Trix.config.attachments.preview;
  Trix.config.attachments.preview.caption = config;
  try {
    return fn();
  } finally {
    Trix.config.attachments.preview.caption = caption;
  }
};

var getCaptionElement = () => getEditorElement().querySelector("figcaption");
