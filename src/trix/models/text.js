/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/attachment_piece
//= require trix/models/string_piece
//= require trix/models/splittable_list

Trix.Text = class Text extends Trix.Object {
  static textForAttachmentWithAttributes(attachment, attributes) {
    const piece = new Trix.AttachmentPiece(attachment, attributes);
    return new (this)([piece]);
  }

  static textForStringWithAttributes(string, attributes) {
    const piece = new Trix.StringPiece(string, attributes);
    return new (this)([piece]);
  }

  static fromJSON(textJSON) {
    const pieces = Array.from(textJSON).map((pieceJSON) =>
      Trix.Piece.fromJSON(pieceJSON));
    return new (this)(pieces);
  }

  constructor(pieces) {
    if (pieces == null) { pieces = []; }
    super(...arguments);
    this.pieceList = new Trix.SplittableList(((() => {
      const result = [];
      for (let piece of Array.from(pieces)) {         if (!piece.isEmpty()) {
          result.push(piece);
        }
      }
      return result;
    })()));
  }

  copy() {
    return this.copyWithPieceList(this.pieceList);
  }

  copyWithPieceList(pieceList) {
    return new this.constructor(pieceList.consolidate().toArray());
  }

  copyUsingObjectMap(objectMap) {
    let left;
    const pieces = Array.from(this.getPieces()).map((piece) =>
      (left = objectMap.find(piece)) != null ? left : piece);
    return new this.constructor(pieces);
  }

  appendText(text) {
    return this.insertTextAtPosition(text, this.getLength());
  }

  insertTextAtPosition(text, position) {
    return this.copyWithPieceList(this.pieceList.insertSplittableListAtPosition(text.pieceList, position));
  }

  removeTextAtRange(range) {
    return this.copyWithPieceList(this.pieceList.removeObjectsInRange(range));
  }

  replaceTextAtRange(text, range) {
    return this.removeTextAtRange(range).insertTextAtPosition(text, range[0]);
  }

  moveTextFromRangeToPosition(range, position) {
    if (range[0] <= position && position <= range[1]) { return; }
    const text = this.getTextAtRange(range);
    const length = text.getLength();
    if (range[0] < position) { position -= length; }
    return this.removeTextAtRange(range).insertTextAtPosition(text, position);
  }

  addAttributeAtRange(attribute, value, range) {
    const attributes = {};
    attributes[attribute] = value;
    return this.addAttributesAtRange(attributes, range);
  }

  addAttributesAtRange(attributes, range) {
    return this.copyWithPieceList(this.pieceList.transformObjectsInRange(range, piece => piece.copyWithAdditionalAttributes(attributes))
    );
  }

  removeAttributeAtRange(attribute, range) {
    return this.copyWithPieceList(this.pieceList.transformObjectsInRange(range, piece => piece.copyWithoutAttribute(attribute))
    );
  }

  setAttributesAtRange(attributes, range) {
    return this.copyWithPieceList(this.pieceList.transformObjectsInRange(range, piece => piece.copyWithAttributes(attributes))
    );
  }

  getAttributesAtPosition(position) {
    let left;
    return (left = __guard__(this.pieceList.getObjectAtPosition(position), x => x.getAttributes())) != null ? left : {};
  }

  getCommonAttributes() {
    const objects = (Array.from(this.pieceList.toArray()).map((piece) => piece.getAttributes()));
    return Trix.Hash.fromCommonAttributesOfObjects(objects).toObject();
  }

  getCommonAttributesAtRange(range) {
    let left;
    return (left = this.getTextAtRange(range).getCommonAttributes()) != null ? left : {};
  }

  getExpandedRangeForAttributeAtOffset(attributeName, offset) {
    let right;
    let left = (right = offset);
    const length = this.getLength();

    while ((left > 0) && this.getCommonAttributesAtRange([left - 1, right])[attributeName]) { left--; }
    while ((right < length) && this.getCommonAttributesAtRange([offset, right + 1])[attributeName]) { right++; }

    return [left, right];
  }

  getTextAtRange(range) {
    return this.copyWithPieceList(this.pieceList.getSplittableListInRange(range));
  }

  getStringAtRange(range) {
    return this.pieceList.getSplittableListInRange(range).toString();
  }

  getStringAtPosition(position) {
    return this.getStringAtRange([position, position + 1]);
  }

  startsWithString(string) {
    return this.getStringAtRange([0, string.length]) === string;
  }

  endsWithString(string) {
    const length = this.getLength();
    return this.getStringAtRange([length - string.length, length]) === string;
  }

  getAttachmentPieces() {
    return (() => {
      const result = [];
      for (let piece of Array.from(this.pieceList.toArray())) {         if (piece.attachment != null) {
          result.push(piece);
        }
      }
      return result;
    })();
  }

  getAttachments() {
    return Array.from(this.getAttachmentPieces()).map((piece) => piece.attachment);
  }

  getAttachmentAndPositionById(attachmentId) {
    let position = 0;
    for (let piece of Array.from(this.pieceList.toArray())) {
      if ((piece.attachment != null ? piece.attachment.id : undefined) === attachmentId) {
        return { attachment: piece.attachment, position };
      }
      position += piece.length;
    }
    return {attachment: null, position: null};
  }

  getAttachmentById(attachmentId) {
    const {attachment, position} = this.getAttachmentAndPositionById(attachmentId);
    return attachment;
  }

  getRangeOfAttachment(attachment) {
    let position;
    ({attachment, position} = this.getAttachmentAndPositionById(attachment.id));
    if (attachment != null) { return [position, position + 1]; }
  }

  updateAttributesForAttachment(attributes, attachment) {
    let range;
    if ((range = this.getRangeOfAttachment(attachment))) {
      return this.addAttributesAtRange(attributes, range);
    } else {
      return this;
    }
  }

  getLength() {
    return this.pieceList.getEndPosition();
  }

  isEmpty() {
    return this.getLength() === 0;
  }

  isEqualTo(text) {
    return super.isEqualTo(...arguments) || __guard__(text != null ? text.pieceList : undefined, x => x.isEqualTo(this.pieceList));
  }

  isBlockBreak() {
    return (this.getLength() === 1) && this.pieceList.getObjectAtIndex(0).isBlockBreak();
  }

  eachPiece(callback) {
    return this.pieceList.eachObject(callback);
  }

  getPieces() {
    return this.pieceList.toArray();
  }

  getPieceAtPosition(position) {
    return this.pieceList.getObjectAtPosition(position);
  }

  contentsForInspection() {
    return {pieceList: this.pieceList.inspect()};
  }

  toSerializableText() {
    const pieceList = this.pieceList.selectSplittableList(piece => piece.isSerializable());
    return this.copyWithPieceList(pieceList);
  }

  toString() {
    return this.pieceList.toString();
  }

  toJSON() {
    return this.pieceList.toJSON();
  }

  toConsole() {
    return JSON.stringify(Array.from(this.pieceList.toArray()).map((piece) => JSON.parse(piece.toConsole())));
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}