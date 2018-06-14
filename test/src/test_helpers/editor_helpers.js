/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const helpers = Trix.TestHelpers;

helpers.extend({
  insertString(string) {
    getComposition().insertString(string);
    return render();
  },

  insertText(text) {
    getComposition().insertText(text);
    return render();
  },

  insertDocument(document) {
    getComposition().insertDocument(document);
    return render();
  },

  insertFile(file) {
    getComposition().insertFile(file);
    return render();
  },

  insertImageAttachment(attributes) {
    if (attributes == null) { attributes = {
      url: TEST_IMAGE_URL,
      width: 10,
      height: 10,
      filename: "image.gif",
      filesize: 35,
      contentType: "image/gif"
    }; }

    const attachment = new Trix.Attachment(attributes);
    const text = Trix.Text.textForAttachmentWithAttributes(attachment);
    return helpers.insertText(text);
  },

  replaceDocument(document) {
    getComposition().setDocument(document);
    return render();
  }
});

var render = () => getEditorController().render();
