/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/attachment
//= require trix/models/piece

Trix.Piece.registerType("attachment", (Trix.AttachmentPiece = class AttachmentPiece extends Trix.Piece {
  static fromJSON(pieceJSON) {
    return new (this)(Trix.Attachment.fromJSON(pieceJSON.attachment), pieceJSON.attributes);
  }

  constructor(attachment) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.attachment = attachment;
    super(...arguments);
    this.length = 1;
    this.ensureAttachmentExclusivelyHasAttribute("href");
  }

  ensureAttachmentExclusivelyHasAttribute(attribute) {
    if (this.hasAttribute(attribute) && this.attachment.hasAttribute(attribute)) {
      return this.attributes = this.attributes.remove(attribute);
    }
  }

  getValue() {
    return this.attachment;
  }

  isSerializable() {
    return !this.attachment.isPending();
  }

  getCaption() {
    let left;
    return (left = this.attributes.get("caption")) != null ? left : "";
  }

  getAttributesForAttachment() {
    return this.attributes.slice(["caption"]);
  }

  canBeGrouped() {
    return super.canBeGrouped(...arguments) && !this.attachment.hasAttribute("href");
  }

  isEqualTo(piece) {
    return super.isEqualTo(...arguments) && (this.attachment.id === __guard__(piece != null ? piece.attachment : undefined, x => x.id));
  }

  toString() {
    return Trix.OBJECT_REPLACEMENT_CHARACTER;
  }

  toJSON() {
    const json = super.toJSON(...arguments);
    json.attachment = this.attachment;
    return json;
  }

  getCacheKey() {
    return [super.getCacheKey(...arguments), this.attachment.getCacheKey()].join("/");
  }

  toConsole() {
    return JSON.stringify(this.toString());
  }
})
);

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}