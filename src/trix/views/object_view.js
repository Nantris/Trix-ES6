/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require_self
//= require trix/views/object_group_view

Trix.ObjectView = class ObjectView extends Trix.BasicObject {
  constructor(object, options) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.object = object;
    if (options == null) { options = {}; }
    this.options = options;
    this.childViews = [];
    this.rootView = this;
  }

  getNodes() {
    if (this.nodes == null) { this.nodes = this.createNodes(); }
    return Array.from(this.nodes).map((node) => node.cloneNode(true));
  }

  invalidate() {
    this.nodes = null;
    return (this.parentView != null ? this.parentView.invalidate() : undefined);
  }

  invalidateViewForObject(object) {
    return __guard__(this.findViewForObject(object), x => x.invalidate());
  }

  findOrCreateCachedChildView(viewClass, object, options) {
    let view;
    if (view = this.getCachedViewForObject(object)) {
      this.recordChildView(view);
    } else {
      view = this.createChildView(...arguments);
      this.cacheViewForObject(view, object);
    }
    return view;
  }

  createChildView(viewClass, object, options) {
    if (options == null) { options = {}; }
    if (object instanceof Trix.ObjectGroup) {
      options.viewClass = viewClass;
      viewClass = Trix.ObjectGroupView;
    }

    const view = new viewClass(object, options);
    return this.recordChildView(view);
  }

  recordChildView(view) {
    view.parentView = this;
    view.rootView = this.rootView;
    if (!Array.from(this.childViews).includes(view)) {
      this.childViews.push(view);
    }
    return view;
  }

  getAllChildViews() {
    let views = [];
    for (let childView of Array.from(this.childViews)) {
      views.push(childView);
      views = views.concat(childView.getAllChildViews());
    }
    return views;
  }

  findElement() {
    return this.findElementForObject(this.object);
  }

  findElementForObject(object) {
    let id;
    if (id = object != null ? object.id : undefined) {
      return this.rootView.element.querySelector(`[data-trix-id='${id}']`);
    }
  }

  findViewForObject(object) {
    for (let view of Array.from(this.getAllChildViews())) { if (view.object === object) { return view; } }
  }

  getViewCache() {
    if (this.rootView === this) {
      if (this.isViewCachingEnabled()) {
        return this.viewCache != null ? this.viewCache : (this.viewCache = {});
      }
    } else {
      return this.rootView.getViewCache();
    }
  }

  isViewCachingEnabled() {
    return this.shouldCacheViews !== false;
  }

  enableViewCaching() {
    return this.shouldCacheViews = true;
  }

  disableViewCaching() {
    return this.shouldCacheViews = false;
  }

  getCachedViewForObject(object) {
    return __guard__(this.getViewCache(), x => x[object.getCacheKey()]);
  }

  cacheViewForObject(view, object) {
    return __guard__(this.getViewCache(), x => x[object.getCacheKey()] = view);
  }

  garbageCollectCachedViews() {
    let cache;
    if (cache = this.getViewCache()) {
      const views = this.getAllChildViews().concat(this);
      const objectKeys = (Array.from(views).map((view) => view.object.getCacheKey()));
      return (() => {
        const result = [];
        for (let key in cache) {
          if (!Array.from(objectKeys).includes(key)) {
            result.push(delete cache[key]);
          }
        }
        return result;
      })();
    }
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}