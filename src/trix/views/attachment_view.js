/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {makeElement} = Trix;
const {css} = Trix.config;

(function() {
  let createCursorTarget = undefined;
  const Cls = (Trix.AttachmentView = class AttachmentView extends Trix.ObjectView {
    static initClass() {
      this.attachmentSelector = "[data-trix-attachment]";
  
      createCursorTarget = name =>
        makeElement({
          tagName: "span",
          textContent: Trix.ZERO_WIDTH_SPACE,
          data: {
            trixCursorTarget: name,
            trixSerialize: false
          }
        })
      ;
    }

    constructor() {
      super(...arguments);
      this.attachment = this.object;
      this.attachment.uploadProgressDelegate = this;
      this.attachmentPiece = this.options.piece;
    }

    createContentNodes() {
      return [];
    }

    createNodes() {
      let element, href;
      const figure = makeElement({tagName: "figure", className: this.getClassName()});

      if (this.attachment.hasContent()) {
        figure.innerHTML = this.attachment.getContent();
      } else {
        for (let node of Array.from(this.createContentNodes())) { figure.appendChild(node); }
      }

      figure.appendChild(this.createCaptionElement());

      const data = {
        trixAttachment: JSON.stringify(this.attachment),
        trixContentType: this.attachment.getContentType(),
        trixId: this.attachment.id
      };

      const attributes = this.attachmentPiece.getAttributesForAttachment();
      if (!attributes.isEmpty()) {
        data.trixAttributes = JSON.stringify(attributes);
      }

      if (this.attachment.isPending()) {
        this.progressElement = makeElement({
          tagName: "progress",
          attributes: {
            class: css.attachmentProgress,
            value: this.attachment.getUploadProgress(),
            max: 100
          },
          data: {
            trixMutable: true,
            trixStoreKey: ["progressElement", this.attachment.id].join("/")
          }
        });

        figure.appendChild(this.progressElement);
        data.trixSerialize = false;
      }

      if (href = this.getHref()) {
        element = makeElement("a", {href, tabindex: -1});
        element.appendChild(figure);
      } else {
        element = figure;
      }

      for (let key in data) { const value = data[key]; element.dataset[key] = value; }
      element.setAttribute("contenteditable", false);

      return [createCursorTarget("left"), element, createCursorTarget("right")];
    }

    createCaptionElement() {
      let caption;
      const figcaption = makeElement({tagName: "figcaption", className: css.attachmentCaption});

      if (caption = this.attachmentPiece.getCaption()) {
        figcaption.classList.add(`${css.attachmentCaption}--edited`);
        figcaption.textContent = caption;
      } else {
        let name, size;
        const config = this.getCaptionConfig();
        if (config.name) { name = this.attachment.getFilename(); }
        if (config.size) { size = this.attachment.getFormattedFilesize(); }

        if (name) {
          const nameElement = makeElement({tagName: "span", className: css.attachmentName, textContent: name});
          figcaption.appendChild(nameElement);
        }

        if (size) {
          if (name) { figcaption.appendChild(document.createTextNode(" ")); }
          const sizeElement = makeElement({tagName: "span", className: css.attachmentSize, textContent: size});
          figcaption.appendChild(sizeElement);
        }
      }

      return figcaption;
    }

    getClassName() {
      let extension;
      const names = [css.attachment, `${css.attachment}--${this.attachment.getType()}`];
      if (extension = this.attachment.getExtension()) {
        names.push(`${css.attachment}--${extension}`);
      }
      return names.join(" ");
    }

    getHref() {
      if (!htmlContainsTagName(this.attachment.getContent(), "a")) {
        return this.attachment.getHref();
      }
    }

    getCaptionConfig() {
      const type = this.attachment.getType();
      const config = Trix.copyObject(Trix.config.attachments[type] != null ? Trix.config.attachments[type].caption : undefined);
      if (type === "file") { config.name = true; }
      return config;
    }

    findProgressElement() {
      return __guard__(this.findElement(), x => x.querySelector("progress"));
    }

    // Attachment delegate

    attachmentDidChangeUploadProgress() {
      const value = this.attachment.getUploadProgress();
      return __guard__(this.findProgressElement(), x => x.value = value);
    }
  });
  Cls.initClass();
  return Cls;
})();

var htmlContainsTagName = function(html, tagName) {
  const div = makeElement("div");
  div.innerHTML = html != null ? html : "";
  return div.querySelector(tagName);
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}