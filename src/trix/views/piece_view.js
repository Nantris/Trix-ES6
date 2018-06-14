/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/views/attachment_view
//= require trix/views/previewable_attachment_view

const {makeElement, findInnerElement, getTextConfig} = Trix;

(function() {
  let nbsp = undefined;
  const Cls = (Trix.PieceView = class PieceView extends Trix.ObjectView {
    static initClass() {
  
      nbsp = Trix.NON_BREAKING_SPACE;
    }
    constructor() {
      super(...arguments);
      this.piece = this.object;
      this.attributes = this.piece.getAttributes();
      ({textConfig: this.textConfig, context: this.context} = this.options);

      if (this.piece.attachment) {
        this.attachment = this.piece.attachment;
      } else {
        this.string = this.piece.toString();
      }
    }

    createNodes() {
      let element;
      let nodes = this.attachment ?
        this.createAttachmentNodes()
      :
        this.createStringNodes();

      if (element = this.createElement()) {
        const innerElement = findInnerElement(element);
        for (let node of Array.from(nodes)) { innerElement.appendChild(node); }
        nodes = [element];
      }
      return nodes;
    }

    createAttachmentNodes() {
      const constructor = this.attachment.isPreviewable() ?
        Trix.PreviewableAttachmentView
      :
        Trix.AttachmentView;

      const view = this.createChildView(constructor, this.piece.attachment, {piece: this.piece});
      return view.getNodes();
    }

    createStringNodes() {
      if (this.textConfig != null ? this.textConfig.plaintext : undefined) {
        return [document.createTextNode(this.string)];
      } else {
        const nodes = [];
        const iterable = this.string.split("\n");
        for (let index = 0; index < iterable.length; index++) {
          var length;
          const substring = iterable[index];
          if (index > 0) {
            const element = makeElement("br");
            nodes.push(element);
          }

          if (length = substring.length) {
            const node = document.createTextNode(this.preserveSpaces(substring));
            nodes.push(node);
          }
        }
        return nodes;
      }
    }

    createElement() {
      let element, value;
      const styles = {};

      for (var key in this.attributes) {
        var config;
        value = this.attributes[key];
        if ((config = getTextConfig(key))) {
          if (config.tagName) {
            var innerElement;
            const pendingElement = makeElement(config.tagName);

            if (innerElement) {
              innerElement.appendChild(pendingElement);
              innerElement = pendingElement;
            } else {
              element = (innerElement = pendingElement);
            }
          }

          if (config.styleProperty) {
            styles[config.styleProperty] = value;
          }

          if (config.style) {
            for (key in config.style) { value = config.style[key]; styles[key] = value; }
          }
        }
      }

      if (Object.keys(styles).length) {
        if (element == null) { element = makeElement("span"); }
        for (key in styles) { value = styles[key]; element.style[key] = value; }
      }
      return element;
    }

    createContainerElement() {
      for (let key in this.attributes) {
        var config;
        const value = this.attributes[key];
        if ((config = getTextConfig(key))) {
          if (config.groupTagName) {
            const attributes = {};
            attributes[key] = value;
            return makeElement(config.groupTagName, attributes);
          }
        }
      }
    }

    preserveSpaces(string) {
      if (this.context.isLast) {
        string = string.replace(/\ $/, nbsp);
      }

      string = string
        .replace(/(\S)\ {3}(\S)/g, `$1 ${nbsp} $2`)
        .replace(/\ {2}/g, `${nbsp} `)
        .replace(/\ {2}/g, ` ${nbsp}`);

      if (this.context.isFirst || this.context.followsWhitespace) {
        string = string.replace(/^\ /, nbsp);
      }

      return string;
    }
  });
  Cls.initClass();
  return Cls;
})();
