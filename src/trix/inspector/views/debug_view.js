/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/inspector/view

const {handleEvent} = Trix;

Trix.Inspector.registerView((function() {
  const Cls = class extends Trix.Inspector.View {
    static initClass() {
      this.prototype.title = "Debug";
      this.prototype.template = "debug";
    }

    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.didToggleViewCaching = this.didToggleViewCaching.bind(this);
      this.didClickRenderButton = this.didClickRenderButton.bind(this);
      this.didClickParseButton = this.didClickParseButton.bind(this);
      this.didToggleControlElement = this.didToggleControlElement.bind(this);
      super(...arguments);
      handleEvent("change", {onElement: this.element, matchingSelector: "input[name=viewCaching]", withCallback: this.didToggleViewCaching});
      handleEvent("click", {onElement: this.element, matchingSelector: "button[data-action=render]", withCallback: this.didClickRenderButton});
      handleEvent("click", {onElement: this.element, matchingSelector: "button[data-action=parse]", withCallback: this.didClickParseButton});
      handleEvent("change", {onElement: this.element, matchingSelector: "input[name=controlElement]", withCallback: this.didToggleControlElement});
    }

    didToggleViewCaching({target}) {
      if (target.checked) {
        return this.compositionController.enableViewCaching();
      } else {
        return this.compositionController.disableViewCaching();
      }
    }

    didClickRenderButton() {
      return this.editorController.render();
    }

    didClickParseButton() {
      return this.editorController.reparse();
    }

    didToggleControlElement({target}) {
      if (target.checked) {
        return this.control = new Trix.Inspector.ControlElement(this.editorElement);
      } else {
        if (this.control != null) {
          this.control.uninstall();
        }
        return this.control = null;
      }
    }
  };
  Cls.initClass();
  return Cls;
}
)());
