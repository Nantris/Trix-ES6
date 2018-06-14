/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/views/text_view

const {makeElement, getBlockConfig} = Trix;

Trix.BlockView = class BlockView extends Trix.ObjectView {
  constructor() {
    super(...arguments);
    this.block = this.object;
    this.attributes = this.block.getAttributes();
  }

  createNodes() {
    const comment = document.createComment("block");
    const nodes = [comment];
    if (this.block.isEmpty()) {
      nodes.push(makeElement("br"));
    } else {
      const textConfig = __guard__(getBlockConfig(this.block.getLastAttribute()), x => x.text);
      const textView = this.findOrCreateCachedChildView(Trix.TextView, this.block.text, {textConfig});
      nodes.push(...Array.from(textView.getNodes() || []));
      if (this.shouldAddExtraNewlineElement()) { nodes.push(makeElement("br")); }
    }

    if (this.attributes.length) {
      return nodes;
    } else {
      const element = makeElement(Trix.config.blockAttributes.default.tagName);
      for (let node of Array.from(nodes)) { element.appendChild(node); }
      return [element];
    }
  }

  createContainerElement(depth) {
    const attribute = this.attributes[depth];
    const config = getBlockConfig(attribute);
    return makeElement(config.tagName);
  }

  // A single <br> at the end of a block element has no visual representation
  // so add an extra one.
  shouldAddExtraNewlineElement() {
    return /\n\n$/.test(this.block.toString());
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}