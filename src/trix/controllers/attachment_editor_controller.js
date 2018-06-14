/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/controllers/attachment_editor_controller

const {handleEvent, makeElement, tagName} = Trix;
const {keyNames} = Trix.InputController;
const {lang, css} = Trix.config;

(function() {
  let undoable = undefined;
  const Cls = (Trix.AttachmentEditorController = class AttachmentEditorController extends Trix.BasicObject {
    static initClass() {
  
      undoable = fn => function() {
        const commands = fn.apply(this, arguments);
        commands.do();
        if (this.undos == null) { this.undos = []; }
        return this.undos.push(commands.undo);
      } ;
  
      // Installing and uninstalling
  
      this.prototype.makeElementMutable = undoable(function() {
        return {
          do: () => { return this.element.dataset.trixMutable = true; },
          undo: () => delete this.element.dataset.trixMutable
        };
      });
  
      this.prototype.makeCaptionEditable = undoable(function() {
        const figcaption = this.element.querySelector("figcaption");
        let handler = null;
        return {
          do: () => { return handler = handleEvent("click", {onElement: figcaption, withCallback: this.didClickCaption, inPhase: "capturing"}); },
          undo: () => handler.destroy()
        };
      });
  
      this.prototype.addRemoveButton = undoable(function() {
        const removeButton = makeElement({
          tagName: "button",
          textContent: lang.remove,
          className: `${css.attachmentRemove} ${css.attachmentRemove}--icon`,
          attributes: { type: "button", title: lang.remove
        },
          data: { trixMutable: true
        }
        });
        handleEvent("click", {onElement: removeButton, withCallback: this.didClickRemoveButton});
        return {
          do: () => this.element.appendChild(removeButton),
          undo: () => this.element.removeChild(removeButton)
        };
      });
  
      this.prototype.editCaption = undoable(function() {
        const textarea = makeElement({
          tagName: "textarea",
          className: css.attachmentCaptionEditor,
          attributes: { placeholder: lang.captionPlaceholder
        }
        });
        textarea.value = this.attachmentPiece.getCaption();
  
        const textareaClone = textarea.cloneNode();
        textareaClone.classList.add("trix-autoresize-clone");
  
        const autoresize = function() {
          textareaClone.value = textarea.value;
          return textarea.style.height = textareaClone.scrollHeight + "px";
        };
  
        handleEvent("keydown", {onElement: textarea, withCallback: this.didKeyDownCaption});
        handleEvent("input", {onElement: textarea, withCallback: this.didInputCaption});
        handleEvent("change", {onElement: textarea, withCallback: this.didChangeCaption});
        handleEvent("blur", {onElement: textarea, withCallback: this.didBlurCaption});
  
        const figcaption = this.element.querySelector("figcaption");
        const editingFigcaption = figcaption.cloneNode();
  
        return {
          do() {
            figcaption.style.display = "none";
            editingFigcaption.appendChild(textarea);
            editingFigcaption.appendChild(textareaClone);
            editingFigcaption.classList.add(`${css.attachmentCaption}--editing`);
            figcaption.parentElement.insertBefore(editingFigcaption, figcaption);
            autoresize();
            return textarea.focus();
          },
          undo() {
            editingFigcaption.parentNode.removeChild(editingFigcaption);
            return figcaption.style.display = null;
          }
        };
      });
    }
    constructor(attachmentPiece, element, container) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.didClickRemoveButton = this.didClickRemoveButton.bind(this);
      this.didClickCaption = this.didClickCaption.bind(this);
      this.didKeyDownCaption = this.didKeyDownCaption.bind(this);
      this.didInputCaption = this.didInputCaption.bind(this);
      this.didChangeCaption = this.didChangeCaption.bind(this);
      this.didBlurCaption = this.didBlurCaption.bind(this);
      this.attachmentPiece = attachmentPiece;
      this.element = element;
      this.container = container;
      ({attachment: this.attachment} = this.attachmentPiece);
      if (tagName(this.element) === "a") { this.element = this.element.firstChild; }
      this.install();
    }

    install() {
      this.makeElementMutable();
      if (this.attachment.isPreviewable()) { this.makeCaptionEditable(); }
      return this.addRemoveButton();
    }

    uninstall() {
      let undo;
      this.savePendingCaption();
      while ((undo = this.undos.pop())) { undo(); }
      return (this.delegate != null ? this.delegate.didUninstallAttachmentEditor(this) : undefined);
    }

    // Private

    savePendingCaption() {
      if (this.pendingCaption != null) {
        const caption = this.pendingCaption;
        this.pendingCaption = null;
        if (caption) {
          return __guardMethod__(this.delegate, 'attachmentEditorDidRequestUpdatingAttributesForAttachment', o => o.attachmentEditorDidRequestUpdatingAttributesForAttachment({caption}, this.attachment));
        } else {
          return __guardMethod__(this.delegate, 'attachmentEditorDidRequestRemovingAttributeForAttachment', o1 => o1.attachmentEditorDidRequestRemovingAttributeForAttachment("caption", this.attachment));
        }
      }
    }

    // Event handlers

    didClickRemoveButton(event) {
      event.preventDefault();
      event.stopPropagation();
      return (this.delegate != null ? this.delegate.attachmentEditorDidRequestRemovalOfAttachment(this.attachment) : undefined);
    }

    didClickCaption(event) {
      event.preventDefault();
      return this.editCaption();
    }

    didKeyDownCaption(event) {
      if (keyNames[event.keyCode] === "return") {
        event.preventDefault();
        this.savePendingCaption();
        return __guardMethod__(this.delegate, 'attachmentEditorDidRequestDeselectingAttachment', o => o.attachmentEditorDidRequestDeselectingAttachment(this.attachment));
      }
    }

    didInputCaption(event) {
      return this.pendingCaption = event.target.value.replace(/\s/g, " ").trim();
    }

    didChangeCaption(event) {
      return this.savePendingCaption();
    }

    didBlurCaption(event) {
      return this.savePendingCaption();
    }
  });
  Cls.initClass();
  return Cls;
})();

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}