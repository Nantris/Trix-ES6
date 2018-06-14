/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {handleEvent} = Trix;

Trix.Inspector.View = class View {
  constructor(editorElement) {
    this.editorElement = editorElement;
    ({editorController: this.editorController, editor: this.editor} = this.editorElement);
    ({compositionController: this.compositionController, composition: this.composition} = this.editorController);

    this.element = document.createElement("details");
    if (this.getSetting("open") === "true") { this.element.open = true; }
    this.element.classList.add(this.template);

    this.titleElement = document.createElement("summary");
    this.element.appendChild(this.titleElement);

    this.panelElement = document.createElement("div");
    this.panelElement.classList.add("panel");
    this.element.appendChild(this.panelElement);

    this.element.addEventListener("toggle", event => {
      if (event.target === this.element) {
        return this.didToggle();
      }
    });

    if (this.events) { this.installEventHandlers(); }
  }

  installEventHandlers() {
    return (() => {
      const result = [];
      for (let eventName in this.events) {
        const handler = this.events[eventName];
        result.push(((eventName, handler) => {
          return handleEvent(eventName, { onElement: this.editorElement, withCallback: event => {
            return requestAnimationFrame(() => {
              return handler.call(this, event);
            });
          }
        }
          );
        })(eventName, handler));
      }
      return result;
    })();
  }

  didToggle(event) {
    this.saveSetting("open", this.isOpen());
    return this.render();
  }

  isOpen() {
    return this.element.hasAttribute("open");
  }

  getTitle() {
    return this.title != null ? this.title : "";
  }

  render() {
    this.renderTitle();
    if (this.isOpen()) {
      return this.panelElement.innerHTML = JST[`trix/inspector/templates/${this.template}`](this);
    }
  }

  renderTitle() {
    return this.titleElement.innerHTML = this.getTitle();
  }

  getSetting(key) {
    key = this.getSettingsKey(key);
    return (window.sessionStorage != null ? window.sessionStorage[key] : undefined);
  }

  saveSetting(key, value) {
    key = this.getSettingsKey(key);
    return (window.sessionStorage != null ? window.sessionStorage[key] = value : undefined);
  }

  getSettingsKey(key) {
    return `trix/inspector/${this.template}/${key}`;
  }
};
