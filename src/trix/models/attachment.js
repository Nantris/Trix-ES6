/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/operations/image_preload_operation

const Cls = (Trix.Attachment = class Attachment extends Trix.Object {
  static initClass() {
    this.previewablePattern = /^image(\/(gif|png|jpe?g)|$)/;
  }

  static attachmentForFile(file) {
    const attributes = this.attributesForFile(file);
    const attachment = new (this)(attributes);
    attachment.setFile(file);
    return attachment;
  }

  static attributesForFile(file) {
    return new Trix.Hash({
      filename:    file.name,
      filesize:    file.size,
      contentType: file.type
    });
  }

  static fromJSON(attachmentJSON) {
    return new (this)(attachmentJSON);
  }

  constructor(attributes) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.releaseFile = this.releaseFile.bind(this);
    if (attributes == null) { attributes = {}; }
    super(...arguments);
    this.attributes = Trix.Hash.box(attributes);
    this.didChangeAttributes();
  }

  getAttribute(attribute) {
    return this.attributes.get(attribute);
  }

  hasAttribute(attribute) {
    return this.attributes.has(attribute);
  }

  getAttributes() {
    return this.attributes.toObject();
  }

  setAttributes(attributes) {
    if (attributes == null) { attributes = {}; }
    const newAttributes = this.attributes.merge(attributes);
    if (!this.attributes.isEqualTo(newAttributes)) {
      this.attributes = newAttributes;
      this.didChangeAttributes();
      __guardMethod__(this.previewDelegate, 'attachmentDidChangeAttributes', o => o.attachmentDidChangeAttributes(this));
      return __guardMethod__(this.delegate, 'attachmentDidChangeAttributes', o1 => o1.attachmentDidChangeAttributes(this));
    }
  }

  didChangeAttributes() {
    if (this.isPreviewable()) {
      return this.preloadURL();
    }
  }

  isPending() {
    return (this.file != null) && !(this.getURL() || this.getHref());
  }

  isPreviewable() {
    if (this.attributes.has("previewable")) {
      return this.attributes.get("previewable");
    } else {
      return this.constructor.previewablePattern.test(this.getContentType());
    }
  }

  getType() {
    if (this.hasContent()) {
      return "content";
    } else if (this.isPreviewable()) {
      return "preview";
    } else {
      return "file";
    }
  }

  getURL() {
    return this.attributes.get("url");
  }

  getHref() {
    return this.attributes.get("href");
  }

  getFilename() {
    let left;
    return (left = this.attributes.get("filename")) != null ? left : "";
  }

  getFilesize() {
    return this.attributes.get("filesize");
  }

  getFormattedFilesize() {
    const filesize = this.attributes.get("filesize");
    if (typeof filesize === "number") {
      return Trix.config.fileSize.formatter(filesize);
    } else {
      return "";
    }
  }

  getExtension() {
    return __guard__(this.getFilename().match(/\.(\w+)$/), x => x[1].toLowerCase());
  }

  getContentType() {
    return this.attributes.get("contentType");
  }

  hasContent() {
    return this.attributes.has("content");
  }

  getContent() {
    return this.attributes.get("content");
  }

  getWidth() {
    return this.attributes.get("width");
  }

  getHeight() {
    return this.attributes.get("height");
  }

  getFile() {
    return this.file;
  }

  setFile(file) {
    this.file = file;
    if (this.isPreviewable()) {
      return this.preloadFile();
    }
  }

  releaseFile() {
    this.releasePreloadedFile();
    return this.file = null;
  }

  getUploadProgress() {
    return this.uploadProgress != null ? this.uploadProgress : 0;
  }

  setUploadProgress(value) {
    if (this.uploadProgress !== value) {
      this.uploadProgress = value;
      return __guardMethod__(this.uploadProgressDelegate, 'attachmentDidChangeUploadProgress', o => o.attachmentDidChangeUploadProgress(this));
    }
  }

  toJSON() {
    return this.getAttributes();
  }

  getCacheKey() {
    return [super.getCacheKey(...arguments), this.attributes.getCacheKey(), this.getPreviewURL()].join("/");
  }

  // Previewable

  getPreviewURL() {
    return this.previewURL || this.preloadingURL;
  }

  setPreviewURL(url) {
    if (url !== this.getPreviewURL()) {
      this.previewURL = url;
      __guardMethod__(this.previewDelegate, 'attachmentDidChangeAttributes', o => o.attachmentDidChangeAttributes(this));
      return __guardMethod__(this.delegate, 'attachmentDidChangePreviewURL', o1 => o1.attachmentDidChangePreviewURL(this));
    }
  }

  preloadURL() {
    return this.preload(this.getURL(), this.releaseFile);
  }

  preloadFile() {
    if (this.file) {
      this.fileObjectURL = URL.createObjectURL(this.file);
      return this.preload(this.fileObjectURL);
    }
  }

  releasePreloadedFile() {
    if (this.fileObjectURL) {
      URL.revokeObjectURL(this.fileObjectURL);
      return this.fileObjectURL = null;
    }
  }

  preload(url, callback) {
    if (url && (url !== this.getPreviewURL())) {
      this.preloadingURL = url;
      const operation = new Trix.ImagePreloadOperation(url);
      return operation.then(({width, height}) => {
        this.setAttributes({width, height});
        this.preloadingURL = null;
        this.setPreviewURL(url);
        return (typeof callback === 'function' ? callback() : undefined);
      });
    }
  }
});
Cls.initClass();

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}