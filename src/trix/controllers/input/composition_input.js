/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {browser} = Trix;

const Cls = (Trix.CompositionInput = class CompositionInput extends Trix.BasicObject {
  static initClass() {
  
    this.proxyMethod("inputController.setInputSummary");
    this.proxyMethod("inputController.requestRender");
    this.proxyMethod("inputController.requestReparse");
    this.proxyMethod("responder?.selectionIsExpanded");
    this.proxyMethod("responder?.insertPlaceholder");
    this.proxyMethod("responder?.selectPlaceholder");
    this.proxyMethod("responder?.forgetPlaceholder");
  }
  constructor(inputController) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.inputController = inputController;
    ({responder: this.responder, delegate: this.delegate, inputSummary: this.inputSummary} = this.inputController);
    this.data = {};
  }

  start(data) {
    this.data.start = data;

    if (this.isSignificant()) {
      if ((this.inputSummary.eventName === "keypress") && this.inputSummary.textAdded) {
        if (this.responder != null) {
          this.responder.deleteInDirection("left");
        }
      }

      if (!this.selectionIsExpanded()) {
        this.insertPlaceholder();
        this.requestRender();
      }

      return this.range = this.responder != null ? this.responder.getSelectedRange() : undefined;
    }
  }

  update(data) {
    this.data.update = data;

    if (this.isSignificant()) {
      let range;
      if (range = this.selectPlaceholder()) {
        this.forgetPlaceholder();
        return this.range = range;
      }
    }
  }

  end(data) {
    this.data.end = data;

    if (this.isSignificant()) {
      this.forgetPlaceholder();

      if (this.canApplyToDocument()) {
        this.setInputSummary({preferDocument: true, didInput: false});
        if (this.delegate != null) {
          this.delegate.inputControllerWillPerformTyping();
        }
        if (this.responder != null) {
          this.responder.setSelectedRange(this.range);
        }
        if (this.responder != null) {
          this.responder.insertString(this.data.end);
        }
        return (this.responder != null ? this.responder.setSelectedRange(this.range[0] + this.data.end.length) : undefined);

      } else if ((this.data.start != null) || (this.data.update != null)) {
        this.requestReparse();
        return this.inputController.reset();
      }
    } else {
      return this.inputController.reset();
    }
  }

  getEndData() {
    return this.data.end;
  }

  isEnded() {
    return (this.getEndData() != null);
  }

  isSignificant() {
    if (browser.composesExistingText) {
      return this.inputSummary.didInput;
    } else {
      return true;
    }
  }

  // Private

  canApplyToDocument() {
    return ((this.data.start != null ? this.data.start.length : undefined) === 0) && ((this.data.end != null ? this.data.end.length : undefined) > 0) && (this.range != null);
  }
});
Cls.initClass();
