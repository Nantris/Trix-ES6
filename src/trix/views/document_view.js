/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/views/block_view

const {defer, makeElement} = Trix;

(function() {
  let findStoredElements = undefined;
  let elementsHaveEqualHTML = undefined;
  let ignoreSpaces = undefined;
  const Cls = (Trix.DocumentView = class DocumentView extends Trix.ObjectView {
    static initClass() {
  
      findStoredElements = element => element.querySelectorAll("[data-trix-store-key]");
  
      elementsHaveEqualHTML = (element, otherElement) => ignoreSpaces(element.innerHTML) === ignoreSpaces(otherElement.innerHTML);
  
      ignoreSpaces = html => html.replace(/&nbsp;/g, " ");
    }
    static render(document) {
      const element = makeElement("div");
      const view = new (this)(document, {element});
      view.render();
      view.sync();
      return element;
    }

    constructor() {
      super(...arguments);
      ({element: this.element} = this.options);
      this.elementStore = new Trix.ElementStore;
      this.setDocument(this.object);
    }

    setDocument(document) {
      if (!document.isEqualTo(this.document)) {
        return this.document = (this.object = document);
      }
    }

    render() {
      this.childViews = [];

      this.shadowElement = makeElement("div");

      if (!this.document.isEmpty()) {
        const objects = Trix.ObjectGroup.groupObjects(this.document.getBlocks(), {asTree: true});
        return (() => {
          const result = [];
          for (let object of Array.from(objects)) {
            const view = this.findOrCreateCachedChildView(Trix.BlockView, object);
            result.push(Array.from(view.getNodes()).map((node) => this.shadowElement.appendChild(node)));
          }
          return result;
        })();
      }
    }

    isSynced() {
      return elementsHaveEqualHTML(this.shadowElement, this.element);
    }

    sync() {
      const fragment = this.createDocumentFragmentForSync();
      while (this.element.lastChild) { this.element.removeChild(this.element.lastChild); }
      this.element.appendChild(fragment);
      return this.didSync();
    }

    // Private

    didSync() {
      this.elementStore.reset(findStoredElements(this.element));
      return defer(() => this.garbageCollectCachedViews());
    }

    createDocumentFragmentForSync() {
      const fragment = document.createDocumentFragment();

      for (let node of Array.from(this.shadowElement.childNodes)) {
        fragment.appendChild(node.cloneNode(true));
      }

      for (let element of Array.from(findStoredElements(fragment))) {
        var storedElement;
        if (storedElement = this.elementStore.remove(element)) {
          element.parentNode.replaceChild(storedElement, element);
        }
      }

      return fragment;
    }
  });
  Cls.initClass();
  return Cls;
})();
