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
      this.prototype.title = "Document";
      this.prototype.template = "document";
      this.prototype.events = {
        "trix-change"() {
          return this.render();
        }
      };
    }

    render() {
      this.document = this.editor.getDocument();
      return super.render(...arguments);
    }
  };
  Cls.initClass();
  return Cls;
}
)());
