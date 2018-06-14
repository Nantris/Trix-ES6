/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/observers/mutation_observer
//= require trix/operations/file_verification_operation
//= require trix/controllers/input/composition_input

const {handleEvent, makeElement, innerElementIsActive, objectsAreEqual, tagName} = Trix;

const keyNames = {
  "8":  "backspace",
  "9":  "tab",
  "13": "return",
  "27": "escape",
  "37": "left",
  "39": "right",
  "46": "delete",
  "68": "d",
  "72": "h",
  "79": "o"
};

(function() {
  let pastedFileCount = undefined;
  const Cls = (Trix.InputController = class InputController extends Trix.BasicObject {
    static initClass() {
      pastedFileCount = 0;
  
      this.keyNames = keyNames;
  
      // Input handlers
  
      this.prototype.events = {
        keydown(event) {
          let keyName;
          let modifier;
          if (!this.isComposing()) { this.resetInputSummary(); }
          this.inputSummary.didInput = true;
  
          if (keyName = this.constructor.keyNames[event.keyCode]) {
            let context = this.keys;
  
            for (modifier of ["ctrl", "alt", "shift", "meta"]) {
              if (event[`${modifier}Key`]) {
                if (modifier === "ctrl") { modifier = "control"; }
                context = context != null ? context[modifier] : undefined;
              }
            }
  
            if ((context != null ? context[keyName] : undefined) != null) {
              this.setInputSummary({keyName});
              Trix.selectionChangeObserver.reset();
              context[keyName].call(this, event);
            }
          }
  
          if (keyEventIsKeyboardCommand(event)) {
            let character;
            if (character = String.fromCharCode(event.keyCode).toLowerCase()) {
              const keys = ((() => {
                const result = [];
                for (modifier of ["alt", "shift"]) {                   if (event[`${modifier}Key`]) {
                    result.push(modifier);
                  }
                }
                return result;
              })());
              keys.push(character);
              if (this.delegate != null ? this.delegate.inputControllerDidReceiveKeyboardCommand(keys) : undefined) {
                return event.preventDefault();
              }
            }
          }
        },
  
        keypress(event) {
          let string;
          if (this.inputSummary.eventName != null) { return; }
          if ((event.metaKey || event.ctrlKey) && !event.altKey) { return; }
          if (keyEventIsWebInspectorShortcut(event)) { return; }
          if (keyEventIsPasteAndMatchStyleShortcut(event)) { return; }
  
          if (string = stringFromKeyEvent(event)) {
            if (this.delegate != null) {
              this.delegate.inputControllerWillPerformTyping();
            }
            if (this.responder != null) {
              this.responder.insertString(string);
            }
            return this.setInputSummary({textAdded: string, didDelete: this.selectionIsExpanded()});
          }
        },
  
        textInput(event) {
          // Handle autocapitalization
          const {data} = event;
          const {textAdded} = this.inputSummary;
          if (textAdded && (textAdded !== data) && (textAdded.toUpperCase() === data)) {
            const range = this.getSelectedRange();
            this.setSelectedRange([range[0], range[1] + textAdded.length]);
            if (this.responder != null) {
              this.responder.insertString(data);
            }
            this.setInputSummary({textAdded: data});
            return this.setSelectedRange(range);
          }
        },
  
        dragenter(event) {
          return event.preventDefault();
        },
  
        dragstart(event) {
          const { target } = event;
          this.serializeSelectionToDataTransfer(event.dataTransfer);
          this.draggedRange = this.getSelectedRange();
          return __guardMethod__(this.delegate, 'inputControllerDidStartDrag', o => o.inputControllerDidStartDrag());
        },
  
        dragover(event) {
          if (this.draggedRange || this.canAcceptDataTransfer(event.dataTransfer)) {
            event.preventDefault();
            const draggingPoint = {x: event.clientX, y: event.clientY};
            if (!objectsAreEqual(draggingPoint, this.draggingPoint)) {
              this.draggingPoint = draggingPoint;
              return __guardMethod__(this.delegate, 'inputControllerDidReceiveDragOverPoint', o => o.inputControllerDidReceiveDragOverPoint(this.draggingPoint));
            }
          }
        },
  
        dragend(event) {
          __guardMethod__(this.delegate, 'inputControllerDidCancelDrag', o => o.inputControllerDidCancelDrag());
          this.draggedRange = null;
          return this.draggingPoint = null;
        },
  
        drop(event) {
          let documentJSON;
          event.preventDefault();
          const files = event.dataTransfer != null ? event.dataTransfer.files : undefined;
  
          const point = {x: event.clientX, y: event.clientY};
          if (this.responder != null) {
            this.responder.setLocationRangeFromPointRange(point);
          }
  
          if (files != null ? files.length : undefined) {
            this.attachFiles(files);
  
          } else if (this.draggedRange) {
            if (this.delegate != null) {
              this.delegate.inputControllerWillMoveText();
            }
            if (this.responder != null) {
              this.responder.moveTextFromRange(this.draggedRange);
            }
            this.draggedRange = null;
            this.requestRender();
  
          } else if (documentJSON = event.dataTransfer.getData("application/x-trix-document")) {
            const document = Trix.Document.fromJSONString(documentJSON);
            if (this.responder != null) {
              this.responder.insertDocument(document);
            }
            this.requestRender();
          }
  
          this.draggedRange = null;
          return this.draggingPoint = null;
        },
  
        cut(event) {
          if (this.responder != null ? this.responder.selectionIsExpanded() : undefined) {
            if (this.serializeSelectionToDataTransfer(event.clipboardData)) {
              event.preventDefault();
            }
  
            if (this.delegate != null) {
              this.delegate.inputControllerWillCutText();
            }
            this.deleteInDirection("backward");
            if (event.defaultPrevented) { return this.requestRender(); }
          }
        },
  
        copy(event) {
          if (this.responder != null ? this.responder.selectionIsExpanded() : undefined) {
            if (this.serializeSelectionToDataTransfer(event.clipboardData)) {
              return event.preventDefault();
            }
          }
        },
  
        paste(event) {
          let href, html, name;
          const clipboard = event.clipboardData != null ? event.clipboardData : event.testClipboardData;
          const paste = {clipboard};
  
          if ((clipboard == null) || pasteEventIsCrippledSafariHTMLPaste(event)) {
            this.getPastedHTMLUsingHiddenElement(html => {
              paste.type = "text/html";
              paste.html = html;
              if (this.delegate != null) {
                this.delegate.inputControllerWillPaste(paste);
              }
              if (this.responder != null) {
                this.responder.insertHTML(paste.html);
              }
              this.requestRender();
              return (this.delegate != null ? this.delegate.inputControllerDidPaste(paste) : undefined);
            });
            return;
          }
  
          if (href = clipboard.getData("URL")) {
            paste.type = "URL";
            paste.href = href;
            if ((name = clipboard.getData("public.url-name"))) {
              paste.string = Trix.squishBreakableWhitespace(name).trim();
            } else {
              paste.string = href;
            }
            if (this.delegate != null) {
              this.delegate.inputControllerWillPaste(paste);
            }
            this.setInputSummary({textAdded: paste.string, didDelete: this.selectionIsExpanded()});
            if (this.responder != null) {
              this.responder.insertText(Trix.Text.textForStringWithAttributes(paste.string, {href: paste.href}));
            }
            this.requestRender();
            if (this.delegate != null) {
              this.delegate.inputControllerDidPaste(paste);
            }
  
          } else if (dataTransferIsPlainText(clipboard)) {
            paste.type = "text/plain";
            paste.string = clipboard.getData("text/plain");
            if (this.delegate != null) {
              this.delegate.inputControllerWillPaste(paste);
            }
            this.setInputSummary({textAdded: paste.string, didDelete: this.selectionIsExpanded()});
            if (this.responder != null) {
              this.responder.insertString(paste.string);
            }
            this.requestRender();
            if (this.delegate != null) {
              this.delegate.inputControllerDidPaste(paste);
            }
  
          } else if (html = clipboard.getData("text/html")) {
            paste.type = "text/html";
            paste.html = html;
            if (this.delegate != null) {
              this.delegate.inputControllerWillPaste(paste);
            }
            if (this.responder != null) {
              this.responder.insertHTML(paste.html);
            }
            this.requestRender();
            if (this.delegate != null) {
              this.delegate.inputControllerDidPaste(paste);
            }
  
          } else if (Array.from(clipboard.types).includes("Files")) {
            let file;
            if (file = __guardMethod__(clipboard.items != null ? clipboard.items[0] : undefined, 'getAsFile', o => o.getAsFile())) {
              let extension;
              if (!file.name && (extension = extensionForFile(file))) {
                file.name = `pasted-file-${++pastedFileCount}.${extension}`;
              }
              paste.type = "File";
              paste.file = file;
              if (this.delegate != null) {
                this.delegate.inputControllerWillAttachFiles();
              }
              if (this.responder != null) {
                this.responder.insertFile(paste.file);
              }
              this.requestRender();
              if (this.delegate != null) {
                this.delegate.inputControllerDidPaste(paste);
              }
            }
          }
  
          return event.preventDefault();
        },
  
        compositionstart(event) {
          return this.getCompositionInput().start(event.data);
        },
  
        compositionupdate(event) {
          return this.getCompositionInput().update(event.data);
        },
  
        compositionend(event) {
          return this.getCompositionInput().end(event.data);
        },
  
        beforeinput(event) {
          return this.inputSummary.didInput = true;
        },
  
        input(event) {
          this.inputSummary.didInput = true;
          return event.stopPropagation();
        }
      };
  
      this.prototype.keys = {
        backspace(event) {
          if (this.delegate != null) {
            this.delegate.inputControllerWillPerformTyping();
          }
          return this.deleteInDirection("backward", event);
        },
  
        delete(event) {
          if (this.delegate != null) {
            this.delegate.inputControllerWillPerformTyping();
          }
          return this.deleteInDirection("forward", event);
        },
  
        return(event) {
          this.setInputSummary({preferDocument: true});
          if (this.delegate != null) {
            this.delegate.inputControllerWillPerformTyping();
          }
          return (this.responder != null ? this.responder.insertLineBreak() : undefined);
        },
  
        tab(event) {
          if (this.responder != null ? this.responder.canIncreaseNestingLevel() : undefined) {
            if (this.responder != null) {
              this.responder.increaseNestingLevel();
            }
            this.requestRender();
            return event.preventDefault();
          }
        },
  
        left(event) {
          if (this.selectionIsInCursorTarget()) {
            event.preventDefault();
            return (this.responder != null ? this.responder.moveCursorInDirection("backward") : undefined);
          }
        },
  
        right(event) {
          if (this.selectionIsInCursorTarget()) {
            event.preventDefault();
            return (this.responder != null ? this.responder.moveCursorInDirection("forward") : undefined);
          }
        },
  
        control: {
          d(event) {
            if (this.delegate != null) {
              this.delegate.inputControllerWillPerformTyping();
            }
            return this.deleteInDirection("forward", event);
          },
  
          h(event) {
            if (this.delegate != null) {
              this.delegate.inputControllerWillPerformTyping();
            }
            return this.deleteInDirection("backward", event);
          },
  
          o(event) {
            event.preventDefault();
            if (this.delegate != null) {
              this.delegate.inputControllerWillPerformTyping();
            }
            if (this.responder != null) {
              this.responder.insertString("\n", {updatePosition: false});
            }
            return this.requestRender();
          }
        },
  
        shift: {
          return(event) {
            if (this.delegate != null) {
              this.delegate.inputControllerWillPerformTyping();
            }
            if (this.responder != null) {
              this.responder.insertString("\n");
            }
            this.requestRender();
            return event.preventDefault();
          },
  
          tab(event) {
            if (this.responder != null ? this.responder.canDecreaseNestingLevel() : undefined) {
              if (this.responder != null) {
                this.responder.decreaseNestingLevel();
              }
              this.requestRender();
              return event.preventDefault();
            }
          },
  
          left(event) {
            if (this.selectionIsInCursorTarget()) {
              event.preventDefault();
              return this.expandSelectionInDirection("backward");
            }
          },
  
          right(event) {
            if (this.selectionIsInCursorTarget()) {
              event.preventDefault();
              return this.expandSelectionInDirection("forward");
            }
          }
        },
  
        alt: {
          backspace(event) {
            this.setInputSummary({preferDocument: false});
            return (this.delegate != null ? this.delegate.inputControllerWillPerformTyping() : undefined);
          }
        },
  
        meta: {
          backspace(event) {
            this.setInputSummary({preferDocument: false});
            return (this.delegate != null ? this.delegate.inputControllerWillPerformTyping() : undefined);
          }
        }
      };
  
      this.proxyMethod("responder?.getSelectedRange");
      this.proxyMethod("responder?.setSelectedRange");
      this.proxyMethod("responder?.expandSelectionInDirection");
      this.proxyMethod("responder?.selectionIsInCursorTarget");
      this.proxyMethod("responder?.selectionIsExpanded");
    }

    constructor(element) {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { return this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.element = element;
      this.resetInputSummary();

      this.mutationObserver = new Trix.MutationObserver(this.element);
      this.mutationObserver.delegate = this;

      for (let eventName in this.events) {
        handleEvent(eventName, {onElement: this.element, withCallback: this.handlerFor(eventName), inPhase: "capturing"});
      }
    }

    handlerFor(eventName) {
      return event => {
        return this.handleInput(function() {
          if (!innerElementIsActive(this.element)) {
            this.eventName = eventName;
            return this.events[eventName].call(this, event);
          }
        });
      };
    }

    setInputSummary(summary) {
      if (summary == null) { summary = {}; }
      this.inputSummary.eventName = this.eventName;
      for (let key in summary) { const value = summary[key]; this.inputSummary[key] = value; }
      return this.inputSummary;
    }

    resetInputSummary() {
      return this.inputSummary = {};
    }

    reset() {
      this.resetInputSummary();
      return Trix.selectionChangeObserver.reset();
    }

    // Render cycle

    editorWillSyncDocumentView() {
      return this.mutationObserver.stop();
    }

    editorDidSyncDocumentView() {
      return this.mutationObserver.start();
    }

    requestRender() {
      return __guardMethod__(this.delegate, 'inputControllerDidRequestRender', o => o.inputControllerDidRequestRender());
    }

    requestReparse() {
      __guardMethod__(this.delegate, 'inputControllerDidRequestReparse', o => o.inputControllerDidRequestReparse());
      return this.requestRender();
    }

    // Mutation observer delegate

    elementDidMutate(mutationSummary) {
      if (this.isComposing()) {
        return __guardMethod__(this.delegate, 'inputControllerDidAllowUnhandledInput', o => o.inputControllerDidAllowUnhandledInput());
      } else {
        return this.handleInput(function() {
          if (this.mutationIsSignificant(mutationSummary)) {
            if (this.mutationIsExpected(mutationSummary)) {
              this.requestRender();
            } else {
              this.requestReparse();
            }
          }
          return this.reset();
        });
      }
    }

    mutationIsExpected({textAdded, textDeleted}) {
      if (this.inputSummary.preferDocument) { return true; }

      const mutationAdditionMatchesSummary =
        (textAdded != null) ?
          textAdded === this.inputSummary.textAdded
        :
          !this.inputSummary.textAdded;
      const mutationDeletionMatchesSummary =
        (textDeleted != null) ?
          this.inputSummary.didDelete
        :
          !this.inputSummary.didDelete;

      const unexpectedNewlineAddition =
        ["\n", " \n"].includes(textAdded) && !mutationAdditionMatchesSummary;
      const unexpectedNewlineDeletion =
        (textDeleted === "\n") && !mutationDeletionMatchesSummary;
      const singleUnexpectedNewline =
        (unexpectedNewlineAddition && !unexpectedNewlineDeletion) ||
        (unexpectedNewlineDeletion && !unexpectedNewlineAddition);

      if (singleUnexpectedNewline) {
        let range;
        if (range = this.getSelectedRange()) {
          const offset =
            unexpectedNewlineAddition ?
              textAdded.replace(/\n$/, "").length || -1
            :
              (textAdded != null ? textAdded.length : undefined) || 1;
          if (this.responder != null ? this.responder.positionIsBlockBreak(range[1] + offset) : undefined) {
            return true;
          }
        }
      }

      return mutationAdditionMatchesSummary && mutationDeletionMatchesSummary;
    }

    mutationIsSignificant(mutationSummary) {
      const textChanged = Object.keys(mutationSummary).length > 0;
      const composedEmptyString = (this.compositionInput != null ? this.compositionInput.getEndData() : undefined) === "";
      return textChanged || !composedEmptyString;
    }

    // File verification

    attachFiles(files) {
      const operations = (Array.from(files).map((file) => new Trix.FileVerificationOperation(file)));
      return Promise.all(operations).then(files => {
        return this.handleInput(function() {
          if (this.delegate != null) {
            this.delegate.inputControllerWillAttachFiles();
          }
          if (this.responder != null) {
            this.responder.insertFiles(files);
          }
          return this.requestRender();
        });
      });
    }

    // Private

    handleInput(callback) {
      try {
        if (this.delegate != null) {
          this.delegate.inputControllerWillHandleInput();
        }
        return callback.call(this);
      } finally {
        if (this.delegate != null) {
          this.delegate.inputControllerDidHandleInput();
        }
      }
    }

    getCompositionInput() {
      if (this.isComposing()) {
        return this.compositionInput;
      } else {
        return this.compositionInput = new Trix.CompositionInput(this);
      }
    }

    isComposing() {
      return (this.compositionInput != null) && !this.compositionInput.isEnded();
    }

    deleteInDirection(direction, event) {
      if ((this.responder != null ? this.responder.deleteInDirection(direction) : undefined) === false) {
        if (event) {
          event.preventDefault();
          return this.requestRender();
        }
      } else {
        return this.setInputSummary({didDelete: true});
      }
    }

    serializeSelectionToDataTransfer(dataTransfer) {
      if (!dataTransferIsWritable(dataTransfer)) { return; }
      const document = this.responder != null ? this.responder.getSelectedDocument().toSerializableDocument() : undefined;

      dataTransfer.setData("application/x-trix-document", JSON.stringify(document));
      dataTransfer.setData("text/html", Trix.DocumentView.render(document).innerHTML);
      dataTransfer.setData("text/plain", document.toString().replace(/\n$/, ""));
      return true;
    }

    canAcceptDataTransfer(dataTransfer) {
      const types = {};
      for (let type of Array.from((dataTransfer != null ? dataTransfer.types : undefined) != null ? (dataTransfer != null ? dataTransfer.types : undefined) : [])) { types[type] = true; }
      return types["Files"] || types["application/x-trix-document"] || types["text/html"] || types["text/plain"];
    }

    getPastedHTMLUsingHiddenElement(callback) {
      const selectedRange = this.getSelectedRange();

      const style = {
        position: "absolute",
        left: `${window.pageXOffset}px`,
        top: `${window.pageYOffset}px`,
        opacity: 0
      };

      const element = makeElement({style, tagName: "div", editable: true});
      document.body.appendChild(element);
      element.focus();

      return requestAnimationFrame(() => {
        const html = element.innerHTML;
        document.body.removeChild(element);
        this.setSelectedRange(selectedRange);
        return callback(html);
      });
    }
  });
  Cls.initClass();
  return Cls;
})();

var extensionForFile = file => __guard__(file.type != null ? file.type.match(/\/(\w+)$/) : undefined, x => x[1]);

const hasStringCodePointAt = ((typeof " ".codePointAt === 'function' ? " ".codePointAt(0) : undefined) != null);

var stringFromKeyEvent = function(event) {
  if (event.key && hasStringCodePointAt && (event.key.codePointAt(0) === event.keyCode)) {
    return event.key;
  } else {
    let code;
    if (event.which === null) {
      code = event.keyCode;
    } else if ((event.which !== 0) && (event.charCode !== 0)) {
      code = event.charCode;
    }

    if ((code != null) && (keyNames[code] !== "escape")) {
      return Trix.UTF16String.fromCodepoints([code]).toString();
    }
  }
};

var keyEventIsWebInspectorShortcut = event => event.metaKey && event.altKey && !event.shiftKey && (event.keyCode === 94);

var keyEventIsPasteAndMatchStyleShortcut = event => event.metaKey && event.altKey && event.shiftKey && (event.keyCode === 9674);

var keyEventIsKeyboardCommand = function(event) {
  if (/Mac|^iP/.test(navigator.platform)) { return event.metaKey; } else { return event.ctrlKey; }
};

var pasteEventIsCrippledSafariHTMLPaste = function(event) {
  let paste;
  if (paste = event.clipboardData) {
    if (Array.from(paste.types).includes("text/html")) {
      // Answer is yes if there's any possibility of Paste and Match Style in Safari,
      // which is nearly impossible to detect confidently: https://bugs.webkit.org/show_bug.cgi?id=174165
      for (let type of Array.from(paste.types)) {
        const hasPasteboardFlavor = /^CorePasteboardFlavorType/.test(type);
        const hasReadableDynamicData = /^dyn\./.test(type) && paste.getData(type);
        const mightBePasteAndMatchStyle = hasPasteboardFlavor || hasReadableDynamicData;
        if (mightBePasteAndMatchStyle) { return true; }
      }
      return false;
    } else {
      const isExternalHTMLPaste = Array.from(paste.types).includes("com.apple.webarchive");
      const isExternalRichTextPaste = Array.from(paste.types).includes("com.apple.flat-rtfd");
      return isExternalHTMLPaste || isExternalRichTextPaste;
    }
  }
};

var dataTransferIsPlainText = function(dataTransfer) {
  const text = dataTransfer.getData("text/plain");
  const html = dataTransfer.getData("text/html");

  if (text && html) {
    const element = makeElement("div");
    element.innerHTML = html;
    if (element.textContent === text) {
      return !element.querySelector(":not(meta)");
    }
  } else {
    return (text != null ? text.length : undefined);
  }
};

const testTransferData = {"application/x-trix-feature-detection": "test"};

var dataTransferIsWritable = function(dataTransfer) {
  if ((dataTransfer != null ? dataTransfer.setData : undefined) == null) { return; }
  for (var key in testTransferData) {
    var value = testTransferData[key];
    if (!(() => { try {
      dataTransfer.setData(key, value);
      return dataTransfer.getData(key) === value;
    } catch (error) {} })()) { return; }
  }
  return true;
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}