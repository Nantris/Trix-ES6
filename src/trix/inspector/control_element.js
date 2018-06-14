/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
(function() {
  let keyEvents = undefined;
  let compositionEvents = undefined;
  let observerOptions = undefined;
  let inspectNode = undefined;
  const Cls = (Trix.Inspector.ControlElement = class ControlElement {
    static initClass() {
      keyEvents = "keydown keypress input".split(" ");
      compositionEvents = "compositionstart compositionupdate compositionend textInput".split(" ");
  
      observerOptions = {
        attributes: true,
        childList: true,
        characterData: true,
        characterDataOldValue: true,
        subtree: true
      };
  
      inspectNode = function(node) {
        if (node.data != null) {
          return JSON.stringify(node.data);
        } else {
          return JSON.stringify(node.outerHTML);
        }
      };
    }

    constructor(editorElement) {
      this.didMutate = this.didMutate.bind(this);
      this.editorElement = editorElement;
      this.install();
    }

    install() {
      this.createElement();
      this.logInputEvents();
      return this.logMutations();
    }

    uninstall() {
      this.observer.disconnect();
      return this.element.parentNode.removeChild(this.element);
    }

    createElement() {
      this.element = document.createElement("div");
      this.element.setAttribute("contenteditable", "");
      this.element.style.width = getComputedStyle(this.editorElement).width;
      this.element.style.minHeight = "50px";
      this.element.style.border = "1px solid green";
      return this.editorElement.parentNode.insertBefore(this.element, this.editorElement.nextSibling);
    }

    logInputEvents() {
      for (var eventName of Array.from(keyEvents)) {
        this.element.addEventListener(eventName, event => console.log(`${event.type}: keyCode = ${event.keyCode}`));
      }

      return (() => {
        const result = [];
        for (eventName of Array.from(compositionEvents)) {
          result.push(this.element.addEventListener(eventName, event => console.log(`${event.type}: data = ${JSON.stringify(event.data)}`)));
        }
        return result;
      })();
    }

    logMutations() {
      this.observer = new window.MutationObserver(this.didMutate);
      return this.observer.observe(this.element, observerOptions);
    }

    didMutate(mutations) {
      console.log(`Mutations (${mutations.length}):`);
      return (() => {
        const result = [];
        for (let index = 0; index < mutations.length; index++) {
          var mutation = mutations[index];
          console.log(` ${index + 1}. ${mutation.type}:`);
          switch (mutation.type) {
            case "characterData":
              result.push(console.log(`  oldValue = ${JSON.stringify(mutation.oldValue)}, newValue = ${JSON.stringify(mutation.target.data)}`));
              break;
            case "childList":
              for (var node of Array.from(mutation.addedNodes)) { console.log(`  node added ${inspectNode(node)}`); }
              result.push((() => {
                const result1 = [];
                for (node of Array.from(mutation.removedNodes)) {                   result1.push(console.log(`  node removed ${inspectNode(node)}`));
                }
                return result1;
              })());
              break;
            default:
              result.push(undefined);
          }
        }
        return result;
      })();
    }
  });
  Cls.initClass();
  return Cls;
})();
