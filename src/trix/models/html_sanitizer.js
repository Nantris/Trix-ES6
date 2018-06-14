/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {tagName, walkTree, nodeIsAttachmentElement} = Trix;

(function() {
  let DEFAULT_ALLOWED_ATTRIBUTES = undefined;
  let elementIsRemovable = undefined;
  let createBodyElementForHTML = undefined;
  const Cls = (Trix.HTMLSanitizer = class HTMLSanitizer extends Trix.BasicObject {
    static initClass() {
      DEFAULT_ALLOWED_ATTRIBUTES = "style href src width height class".split(" ");
  
      elementIsRemovable = function(element) {
        if ((element != null ? element.nodeType : undefined) !== Node.ELEMENT_NODE) { return; }
        if (nodeIsAttachmentElement(element)) { return; }
        return (tagName(element) === "script") || (element.getAttribute("data-trix-serialize") === "false");
      };
  
      createBodyElementForHTML = function(html) {
        // Remove everything after </html>
        if (html == null) { html = ""; }
        html = html.replace(/<\/html[^>]*>[^]*$/i, "</html>");
        const doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = html;
        for (let element of Array.from(doc.head.querySelectorAll("style"))) {
          doc.body.appendChild(element);
        }
        return doc.body;
      };
    }

    static sanitize(html, options) {
      const sanitizer = new (this)(html, options);
      sanitizer.sanitize();
      return sanitizer;
    }

    constructor(html, param) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      if (param == null) { param = {}; }
      const {allowedAttributes} = param;
      this.allowedAttributes = allowedAttributes;
      if (this.allowedAttributes == null) { this.allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES; }
      this.body = createBodyElementForHTML(html);
    }

    sanitize() {
      return this.sanitizeElements();
    }

    getHTML() {
      return this.body.innerHTML;
    }

    getBody() {
      return this.body;
    }

    // Private

    sanitizeElements() {
      let node;
      const walker = walkTree(this.body);
      const nodesToRemove = [];

      while (walker.nextNode()) {
        node = walker.currentNode;
        switch (node.nodeType) {
          case Node.ELEMENT_NODE:
            if (elementIsRemovable(node)) {
              nodesToRemove.push(node);
            } else {
              this.sanitizeElement(node);
            }
            break;
          case Node.COMMENT_NODE:
            nodesToRemove.push(node);
            break;
        }
      }

      for (node of Array.from(nodesToRemove)) {
        node.parentNode.removeChild(node);
      }
      return this.body;
    }

    sanitizeElement(element) {
      for (let {name} of [...Array.from(element.attributes)]) {
        if (!Array.from(this.allowedAttributes).includes(name) && (name.indexOf("data-trix") !== 0)) {
          element.removeAttribute(name);
        }
      }
      return element;
    }
  });
  Cls.initClass();
  return Cls;
})();
