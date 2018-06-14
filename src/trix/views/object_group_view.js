/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.ObjectGroupView = class ObjectGroupView extends Trix.ObjectView {
  constructor() {
    super(...arguments);
    this.objectGroup = this.object;
    ({viewClass: this.viewClass} = this.options);
    delete this.options.viewClass;
  }

  getChildViews() {
    if (!this.childViews.length) {
      for (let object of Array.from(this.objectGroup.getObjects())) {
        this.findOrCreateCachedChildView(this.viewClass, object, this.options);
      }
    }
    return this.childViews;
  }

  createNodes() {
    const element = this.createContainerElement();

    for (let view of Array.from(this.getChildViews())) {
      for (let node of Array.from(view.getNodes())) { element.appendChild(node); }
    }

    return [element];
  }

  createContainerElement(depth) {
    if (depth == null) { depth = this.objectGroup.getDepth(); }
    return this.getChildViews()[0].createContainerElement(depth);
  }
};
