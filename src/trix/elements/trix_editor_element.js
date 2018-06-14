/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/elements/trix_toolbar_element
//= require trix/controllers/editor_controller

const {browser, makeElement, triggerEvent, handleEvent, handleEventOnce} = Trix;

const {attachmentSelector} = Trix.AttachmentView;

Trix.registerElement("trix-editor", (function() {
  let id = 0;

  // Contenteditable support helpers

  const autofocus = function(element) {
    if (!document.querySelector(":focus")) {
      if (element.hasAttribute("autofocus") && (document.querySelector("[autofocus]") === element)) {
        return element.focus();
      }
    }
  };

  const makeEditable = function(element) {
    if (element.hasAttribute("contenteditable")) { return; }
    element.setAttribute("contenteditable", "");
    return handleEventOnce("focus", {onElement: element, withCallback() { return configureContentEditable(element); }});
  };

  const addAccessibilityRole = function(element) {
    if (element.hasAttribute("role")) { return; }
    return element.setAttribute("role", "textbox");
  };

  var configureContentEditable = function(element) {
    disableObjectResizing(element);
    return setDefaultParagraphSeparator(element);
  };

  var disableObjectResizing = function(element) {
    if (typeof document.queryCommandSupported === 'function' ? document.queryCommandSupported("enableObjectResizing") : undefined) {
      document.execCommand("enableObjectResizing", false, false);
      return handleEvent("mscontrolselect", {onElement: element, preventDefault: true});
    }
  };

  var setDefaultParagraphSeparator = function(element) {
    if (typeof document.queryCommandSupported === 'function' ? document.queryCommandSupported("DefaultParagraphSeparator") : undefined) {
      const {tagName} = Trix.config.blockAttributes.default;
      if (["div", "p"].includes(tagName)) {
        return document.execCommand("DefaultParagraphSeparator", false, tagName);
      }
    }
  };

  // Style

  const cursorTargetStyles = (function() {
    if (browser.forcesObjectResizing) {
      return {
        display: "inline",
        width: "auto"
      };
    } else {
      return {
        display: "inline-block",
        width: "1px"
      };
    }
  })();

  return {
    defaultCSS: `\
%t:empty:not(:focus)::before {
    content: attr(placeholder);
    color: graytext;
    cursor: text;
}

%t a[contenteditable=false] {
    cursor: text;
}

%t img {
    max-width: 100%;
    height: auto;
}

%t ${attachmentSelector} figcaption textarea {
    resize: none;
}

%t ${attachmentSelector} figcaption textarea.trix-autoresize-clone {
    position: absolute;
    left: -9999px;
    max-height: 0px;
}

%t ${attachmentSelector} figcaption[data-trix-placeholder]:empty::before {
    content: attr(data-trix-placeholder);
    color: graytext;
}

%t [data-trix-cursor-target] {
    display: ${cursorTargetStyles.display} !important;
    width: ${cursorTargetStyles.width} !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
}

%t [data-trix-cursor-target=left] {
    vertical-align: top !important;
    margin-left: -1px !important;
}

%t [data-trix-cursor-target=right] {
    vertical-align: bottom !important;
    margin-right: -1px !important;
}\
`,

    // Properties

    trixId: {
      get() {
        if (this.hasAttribute("trix-id")) {
          return this.getAttribute("trix-id");
        } else {
          this.setAttribute("trix-id", ++id);
          return this.trixId;
        }
      }
    },

    toolbarElement: {
      get() {
        if (this.hasAttribute("toolbar")) {
          return (this.ownerDocument != null ? this.ownerDocument.getElementById(this.getAttribute("toolbar")) : undefined);
        } else if (this.parentNode) {
          const toolbarId = `trix-toolbar-${this.trixId}`;
          this.setAttribute("toolbar", toolbarId);
          const element = makeElement("trix-toolbar", {id: toolbarId});
          this.parentNode.insertBefore(element, this);
          return element;
        }
      }
    },

    inputElement: {
      get() {
        if (this.hasAttribute("input")) {
          return (this.ownerDocument != null ? this.ownerDocument.getElementById(this.getAttribute("input")) : undefined);
        } else if (this.parentNode) {
          const inputId = `trix-input-${this.trixId}`;
          this.setAttribute("input", inputId);
          const element = makeElement("input", {type: "hidden", id: inputId});
          this.parentNode.insertBefore(element, this.nextElementSibling);
          return element;
        }
      }
    },

    editor: {
      get() {
        return (this.editorController != null ? this.editorController.editor : undefined);
      }
    },

    name: {
      get() {
        return (this.inputElement != null ? this.inputElement.name : undefined);
      }
    },

    value: {
      get() {
        return (this.inputElement != null ? this.inputElement.value : undefined);
      },
      set(defaultValue) {
        this.defaultValue = defaultValue;
        return (this.editor != null ? this.editor.loadHTML(this.defaultValue) : undefined);
      }
    },

    // Controller delegate methods

    notify(message, data) {
      if (this.editorController) {
        return triggerEvent(`trix-${message}`, {onElement: this, attributes: data});
      }
    },

    setInputElementValue(value) {
      return (this.inputElement != null ? this.inputElement.value = value : undefined);
    },

    // Element lifecycle

    createdCallback() {
      makeEditable(this);
      return addAccessibilityRole(this);
    },

    attachedCallback() {
      if (!this.hasAttribute("data-trix-internal")) {
        if (this.editorController == null) { this.editorController = new Trix.EditorController({editorElement: this, html: (this.defaultValue = this.value)}); }
        this.editorController.registerSelectionManager();
        this.registerResetListener();
        autofocus(this);
        return requestAnimationFrame(() => this.notify("initialize"));
      }
    },

    detachedCallback() {
      if (this.editorController != null) {
        this.editorController.unregisterSelectionManager();
      }
      return this.unregisterResetListener();
    },

    // Form reset support

    registerResetListener() {
      this.resetListener = this.resetBubbled.bind(this);
      return window.addEventListener("reset", this.resetListener, false);
    },

    unregisterResetListener() {
      return window.removeEventListener("reset", this.resetListener, false);
    },

    resetBubbled(event) {
      if (event.target === (this.inputElement != null ? this.inputElement.form : undefined)) {
        if (!event.defaultPrevented) { return this.reset(); }
      }
    },

    reset() {
      return this.value = this.defaultValue;
    }
  };
})()
);
