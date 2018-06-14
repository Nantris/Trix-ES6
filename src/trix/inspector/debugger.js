/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This file is not included in the main Trix bundle and
// should be explicitly required to enable the debugger.

const DEBUG_METHODS = {
  "Trix.AttachmentEditorController": `\
didClickRemoveButton \
uninstall\
`,

  "Trix.CompositionController": `\
didClickAttachment\
`,

  "Trix.EditorController": `\
setEditor \
loadDocument\
`,

  "Trix.InputController": `\
elementDidMutate \
events.keydown \
events.keypress \
events.dragstart \
events.dragover \
events.dragend \
events.drop \
events.cut \
events.paste \
events.compositionstart \
events.compositionend\
`,

  "Trix.ToolbarController": `\
didClickActionButton \
didClickAttributeButton \
didClickDialogButton \
didKeyDownDialogInput\
`
};

const {findClosestElementFromNode} = Trix;

let errorListeners = [];

Trix.Debugger = {
  addErrorListener(listener) {
    if (!Array.from(errorListeners).includes(listener)) {
      return errorListeners.push(listener);
    }
  },

  removeErrorListener(listener) {
    return errorListeners = (Array.from(errorListeners).filter((l) => l !== listener));
  }
};

const installMethodDebugger = function(className, methodName) {
  let adjustedLength, array, propertyNames;
  const [objectName, ...constructorNames] = Array.from(className.split("."));
  array = methodName.split("."),
    adjustedLength = Math.max(array.length, 1),
    propertyNames = array.slice(0, adjustedLength - 1),
    methodName = array[adjustedLength - 1];

  let object = this[objectName];
  for (let constructorName of Array.from(constructorNames)) { object = object[constructorName]; }
  object = object.prototype;
  for (let propertyName of Array.from(propertyNames)) { object = object[propertyName]; }

  if (typeof (object != null ? object[methodName] : undefined) === "function") {
    return object[methodName] = wrapFunctionWithErrorHandler(object[methodName]);
  } else {
    throw new Error("Can't install on non-function");
  }
};

var wrapFunctionWithErrorHandler = function(fn) {
  const trixDebugWrapper = function() {
    try {
      return fn.apply(this, arguments);
    } catch (error) {
      reportError(error);
      throw error;
    }
  };
  return trixDebugWrapper;
};

var reportError = function(error) {
  Trix.Debugger.lastError = error;

  console.error("Trix error!");
  console.log(error.stack);

  const { activeElement } = document;
  const editorElement = findClosestElementFromNode(activeElement, {matchingSelector: "trix-editor"});

  if (editorElement) {
    return notifyErrorListeners(error, editorElement);
  } else {
    return console.warn("Can't find <trix-editor> element. document.activeElement =", activeElement);
  }
};

var notifyErrorListeners = (error, element) =>
  Array.from(errorListeners).map((listener) =>
    (() => { try { return listener(error, element); } catch (error1) {} })())
;

(function() {
  console.groupCollapsed("Trix debugger");

  for (let className in DEBUG_METHODS) {
    const methodNames = DEBUG_METHODS[className];
    for (let methodName of Array.from(methodNames.split(/\s/))) {
      try {
        installMethodDebugger(className, methodName);
        console.log(`✓ ${className}#${methodName}`);
      } catch (error) {
        console.warn(`✗ ${className}#${methodName}:`, error.message);
      }
    }
  }

  return console.groupEnd();
})();
