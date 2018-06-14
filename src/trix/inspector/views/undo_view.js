/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/inspector/view

Trix.Inspector.registerView((function() {
  const Cls = class extends Trix.Inspector.View {
    static initClass() {
      this.prototype.title = "Undo";
      this.prototype.template = "undo";
      this.prototype.events = {
        "trix-change"() {
          return this.render();
        }
      };
    }

    render() {
      ({undoEntries: this.undoEntries, redoEntries: this.redoEntries} = this.editor.undoManager);
      return super.render(...arguments);
    }
  };
  Cls.initClass();
  return Cls;
}
)());
