/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/views/piece_view

(function() {
  let endsWithWhitespace = undefined;
  const Cls = (Trix.TextView = class TextView extends Trix.ObjectView {
    static initClass() {
  
      endsWithWhitespace = piece => /\s$/.test(piece != null ? piece.toString() : undefined);
    }
    constructor() {
      super(...arguments);
      this.text = this.object;
      ({textConfig: this.textConfig} = this.options);
    }

    createNodes() {
      const nodes = [];
      const pieces = Trix.ObjectGroup.groupObjects(this.getPieces());
      const lastIndex = pieces.length - 1;

      for (let index = 0; index < pieces.length; index++) {
        const piece = pieces[index];
        const context = {};
        if (index === 0) { context.isFirst = true; }
        if (index === lastIndex) { context.isLast = true; }
        if (endsWithWhitespace(previousPiece)) { context.followsWhitespace = true; }

        const view = this.findOrCreateCachedChildView(Trix.PieceView, piece, {textConfig: this.textConfig, context});
        nodes.push(...Array.from(view.getNodes() || []));

        var previousPiece = piece;
      }
      return nodes;
    }

    getPieces() {
      return (() => {
        const result = [];
        for (let piece of Array.from(this.text.getPieces())) {           if (!piece.hasAttribute("blockBreak")) {
            result.push(piece);
          }
        }
        return result;
      })();
    }
  });
  Cls.initClass();
  return Cls;
})();
