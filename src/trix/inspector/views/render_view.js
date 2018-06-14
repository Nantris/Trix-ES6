/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/inspector/view

Trix.Inspector.registerView((function() {
  const Cls = class extends Trix.Inspector.View {
    static initClass() {
      this.prototype.title = "Renders";
      this.prototype.template = "render";
      this.prototype.events = {
        "trix-render"() {
          this.renderCount++;
          return this.render();
        },
  
        "trix-sync"() {
          this.syncCount++;
          return this.render();
        }
      };
    }

    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.renderCount = 0;
      this.syncCount = 0;
      super(...arguments);
    }

    getTitle() {
      return `${this.title} (${this.renderCount})`;
    }
  };
  Cls.initClass();
  return Cls;
}
)());
