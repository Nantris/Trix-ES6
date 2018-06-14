/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/views/attachment_view

const {makeElement} = Trix;

Trix.PreviewableAttachmentView = class PreviewableAttachmentView extends Trix.AttachmentView {
  constructor() {
    super(...arguments);
    this.attachment.previewDelegate = this;
  }

  createContentNodes() {
    this.image = makeElement({
      tagName: "img",
      attributes: {
        src: ""
      },
      data: {
        trixMutable: true
      }
    });

    this.refresh(this.image);
    return [this.image];
  }

  createCaptionElement() {
    const figcaption = super.createCaptionElement(...arguments);
    if (!figcaption.textContent) {
      figcaption.setAttribute("data-trix-placeholder", Trix.config.lang.captionPlaceholder);
    }
    return figcaption;
  }

  refresh(image) {
    if (image == null) { image = __guard__(this.findElement(), x => x.querySelector("img")); }
    if (image) { return this.updateAttributesForImage(image); }
  }

  updateAttributesForImage(image) {
    const url = this.attachment.getURL();
    const previewURL = this.attachment.getPreviewURL();
    image.src = previewURL || url;

    if (previewURL === url) {
      image.removeAttribute("data-trix-serialized-attributes");
    } else {
      const serializedAttributes = JSON.stringify({src: url});
      image.setAttribute("data-trix-serialized-attributes", serializedAttributes);
    }

    const width = this.attachment.getWidth();
    const height = this.attachment.getHeight();

    if (width != null) { image.width = width; }
    if (height != null) { image.height = height; }

    const storeKey = ["imageElement", this.attachment.id, image.src, image.width, image.height].join("/");
    return image.dataset.trixStoreKey = storeKey;
  }

  // Attachment delegate

  attachmentDidChangeAttributes() {
    this.refresh(this.image);
    return this.refresh();
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}