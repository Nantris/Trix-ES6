/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Cls = (Trix.Piece = class Piece extends Trix.Object {
  static initClass() {
    this.types = {};
  }

  static registerType(type, constructor) {
    constructor.type = type;
    return this.types[type] = constructor;
  }

  static fromJSON(pieceJSON) {
    let constructor;
    if (constructor = this.types[pieceJSON.type]) {
      return constructor.fromJSON(pieceJSON);
    }
  }

  constructor(value, attributes) {
    if (attributes == null) { attributes = {}; }
    super(...arguments);
    this.attributes = Trix.Hash.box(attributes);
  }

  copyWithAttributes(attributes) {
    return new this.constructor(this.getValue(), attributes);
  }

  copyWithAdditionalAttributes(attributes) {
    return this.copyWithAttributes(this.attributes.merge(attributes));
  }

  copyWithoutAttribute(attribute) {
    return this.copyWithAttributes(this.attributes.remove(attribute));
  }

  copy() {
    return this.copyWithAttributes(this.attributes);
  }

  getAttribute(attribute) {
    return this.attributes.get(attribute);
  }

  getAttributesHash() {
    return this.attributes;
  }

  getAttributes() {
    return this.attributes.toObject();
  }

  getCommonAttributes() {
    let piece;
    if (!(piece = pieceList.getPieceAtIndex(0))) { return {}; }
    let { attributes } = piece;
    let keys = attributes.getKeys();

    pieceList.eachPiece(function(piece) {
      keys = attributes.getKeysCommonToHash(piece.attributes);
      return attributes = attributes.slice(keys);
    });

    return attributes.toObject();
  }

  hasAttribute(attribute) {
    return this.attributes.has(attribute);
  }

  hasSameStringValueAsPiece(piece) {
    return (piece != null) && (this.toString() === piece.toString());
  }

  hasSameAttributesAsPiece(piece) {
    return (piece != null) && ((this.attributes === piece.attributes) || this.attributes.isEqualTo(piece.attributes));
  }

  isBlockBreak() {
    return false;
  }

  isEqualTo(piece) {
    return super.isEqualTo(...arguments) || (
      this.hasSameConstructorAs(piece) &&
      this.hasSameStringValueAsPiece(piece) &&
      this.hasSameAttributesAsPiece(piece)
    );
  }

  isEmpty() {
    return this.length === 0;
  }

  isSerializable() {
    return true;
  }

  toJSON() {
    return {
      type: this.constructor.type,
      attributes: this.getAttributes()
    };
  }

  contentsForInspection() {
    return {
      type: this.constructor.type,
      attributes: this.attributes.inspect()
    };
  }

  // Grouping

  canBeGrouped() {
    return this.hasAttribute("href");
  }

  canBeGroupedWith(piece) {
    return this.getAttribute("href") === piece.getAttribute("href");
  }

  // Splittable

  getLength() {
    return this.length;
  }

  canBeConsolidatedWith(piece) {
    return false;
  }
});
Cls.initClass();
