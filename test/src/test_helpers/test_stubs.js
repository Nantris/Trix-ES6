/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {normalizeRange, rangeIsCollapsed} = Trix;

Trix.TestCompositionDelegate = class TestCompositionDelegate {
  compositionDidRequestChangingSelectionToLocationRange() {
    return this.getSelectionManager().setLocationRange(...arguments);
  }

  getSelectionManager() {
    return this.selectionManager != null ? this.selectionManager : (this.selectionManager = new Trix.TestSelectionManager);
  }
};

Trix.TestSelectionManager = class TestSelectionManager {
  constructor() {
    this.setLocationRange({index: 0, offset: 0});
  }

  getLocationRange() {
    return this.locationRange;
  }

  setLocationRange(locationRange) {
    return this.locationRange = normalizeRange(locationRange);
  }

  preserveSelection(block) {
    const locationRange = this.getLocationRange();
    block();
    return this.locationRange = locationRange;
  }

  setLocationRangeFromPoint(point) {}

  locationIsCursorTarget() {
    return false;
  }

  selectionIsExpanded() {
    return !rangeIsCollapsed(this.getLocationRange());
  }
};
