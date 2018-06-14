/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/location_mapper
//= require trix/models/point_mapper
//= require trix/observers/selection_change_observer

const {getDOMSelection, getDOMRange, setDOMRange, elementContainsNode,
 nodeIsCursorTarget, innerElementIsActive, handleEvent, normalizeRange,
 rangeIsCollapsed, rangesAreEqual} = Trix;

const Cls = (Trix.SelectionManager = class SelectionManager extends Trix.BasicObject {
  static initClass() {
  
    // Private
  
    this.proxyMethod("locationMapper.findLocationFromContainerAndOffset");
    this.proxyMethod("locationMapper.findContainerAndOffsetFromLocation");
    this.proxyMethod("locationMapper.findNodeAndOffsetFromLocation");
    this.proxyMethod("pointMapper.createDOMRangeFromPoint");
    this.proxyMethod("pointMapper.getClientRectsForDOMRange");
  }
  constructor(element) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.didMouseDown = this.didMouseDown.bind(this);
    this.selectionDidChange = this.selectionDidChange.bind(this);
    this.element = element;
    this.locationMapper = new Trix.LocationMapper(this.element);
    this.pointMapper = new Trix.PointMapper;
    this.lockCount = 0;
    handleEvent("mousedown", {onElement: this.element, withCallback: this.didMouseDown});
  }

  getLocationRange(options) {
    let locationRange;
    if (options == null) { options = {}; }
    return locationRange =
      options.strict === false ?
        this.createLocationRangeFromDOMRange(getDOMRange(), {strict: false})
      : options.ignoreLock ?
        this.currentLocationRange
      :
        this.lockedLocationRange != null ? this.lockedLocationRange : this.currentLocationRange;
  }

  setLocationRange(locationRange) {
    let domRange;
    if (this.lockedLocationRange) { return; }
    locationRange = normalizeRange(locationRange);
    if (domRange = this.createDOMRangeFromLocationRange(locationRange)) {
      setDOMRange(domRange);
      return this.updateCurrentLocationRange(locationRange);
    }
  }

  setLocationRangeFromPointRange(pointRange) {
    pointRange = normalizeRange(pointRange);
    const startLocation = this.getLocationAtPoint(pointRange[0]);
    const endLocation = this.getLocationAtPoint(pointRange[1]);
    return this.setLocationRange([startLocation, endLocation]);
  }

  getClientRectAtLocationRange(locationRange) {
    let domRange;
    if (domRange = this.createDOMRangeFromLocationRange(locationRange)) {
      return this.getClientRectsForDOMRange(domRange)[1];
    }
  }

  locationIsCursorTarget(location) {
    const [node, offset] = Array.from(this.findNodeAndOffsetFromLocation(location));
    return nodeIsCursorTarget(node);
  }

  lock() {
    if (this.lockCount++ === 0) {
      this.updateCurrentLocationRange();
      return this.lockedLocationRange = this.getLocationRange();
    }
  }

  unlock() {
    if (--this.lockCount === 0) {
      const { lockedLocationRange } = this;
      this.lockedLocationRange = null;
      if (lockedLocationRange != null) { return this.setLocationRange(lockedLocationRange); }
    }
  }

  clearSelection() {
    return __guard__(getDOMSelection(), x => x.removeAllRanges());
  }

  selectionIsCollapsed() {
    return __guard__(getDOMRange(), x => x.collapsed) === true;
  }

  selectionIsExpanded() {
    return !this.selectionIsCollapsed();
  }

  didMouseDown() {
    return this.pauseTemporarily();
  }

  pauseTemporarily() {
    let resumeHandlers;
    this.paused = true;

    const resume = () => {
      this.paused = false;
      clearTimeout(resumeTimeout);
      for (let handler of Array.from(resumeHandlers)) {
        handler.destroy();
      }
      if (elementContainsNode(document, this.element)) {
        return this.selectionDidChange();
      }
    };

    var resumeTimeout = setTimeout(resume, 200);
    return resumeHandlers = ["mousemove", "keydown"].map((eventName) =>
      handleEvent(eventName, {onElement: document, withCallback: resume}));
  }

  selectionDidChange() {
    if (!this.paused && !innerElementIsActive(this.element)) {
      return this.updateCurrentLocationRange();
    }
  }

  updateCurrentLocationRange(locationRange) {
    if (locationRange != null ? locationRange : (locationRange = this.createLocationRangeFromDOMRange(getDOMRange()))) {
      if (!rangesAreEqual(locationRange, this.currentLocationRange)) {
        this.currentLocationRange = locationRange;
        return __guardMethod__(this.delegate, 'locationRangeDidChange', o => o.locationRangeDidChange(this.currentLocationRange.slice(0)));
      }
    }
  }

  createDOMRangeFromLocationRange(locationRange) {
    let left;
    const rangeStart = this.findContainerAndOffsetFromLocation(locationRange[0]);
    const rangeEnd = rangeIsCollapsed(locationRange) ?
      rangeStart
    :
      (left = this.findContainerAndOffsetFromLocation(locationRange[1])) != null ? left : rangeStart;

    if ((rangeStart != null) && (rangeEnd != null)) {
      const domRange = document.createRange();
      domRange.setStart(...Array.from(rangeStart || []));
      domRange.setEnd(...Array.from(rangeEnd || []));
      return domRange;
    }
  }

  createLocationRangeFromDOMRange(domRange, options) {
    let end, start;
    if ((domRange == null) || !this.domRangeWithinElement(domRange)) { return; }
    if (!(start = this.findLocationFromContainerAndOffset(domRange.startContainer, domRange.startOffset, options))) { return; }
    if (!domRange.collapsed) { end = this.findLocationFromContainerAndOffset(domRange.endContainer, domRange.endOffset, options); }
    return normalizeRange([start, end]);
  }

  getLocationAtPoint(point) {
    let domRange;
    if (domRange = this.createDOMRangeFromPoint(point)) {
      return __guard__(this.createLocationRangeFromDOMRange(domRange), x => x[0]);
    }
  }

  domRangeWithinElement(domRange) {
    if (domRange.collapsed) {
      return elementContainsNode(this.element, domRange.startContainer);
    } else {
      return elementContainsNode(this.element, domRange.startContainer) && elementContainsNode(this.element, domRange.endContainer);
    }
  }
});
Cls.initClass();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}