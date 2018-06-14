/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const helpers = Trix.TestHelpers;

const keyCodes = {};
for (var code in Trix.InputController.keyNames) {
  const name = Trix.InputController.keyNames[code];
  keyCodes[name] = code;
}

const isIE = /Windows.*Trident/.test(navigator.userAgent);

helpers.extend({
  createEvent(type, properties) {
    if (properties == null) { properties = {}; }
    const event = document.createEvent("Events");
    event.initEvent(type, true, true);
    for (let key in properties) {
      const value = properties[key];
      event[key] = value;
    }
    return event;
  },

  triggerEvent(element, type, properties) {
    return element.dispatchEvent(helpers.createEvent(type, properties));
  },

  pasteContent(contentType, value, callback) {
    let data;
    var key, value;
    if (typeof contentType === "object") {
      data = contentType;
      callback = value;
    } else {
      data = {[contentType]: value};
    }

    const testClipboardData = {
      getData(type) {
        return data[type];
      },
      types: (((() => {
        const result = [];
        for (key in data) {
          result.push(key);
        }
        return result;
      })())),
      items: (((() => {
        const result1 = [];
        for (key in data) {
          value = data[key];
          result1.push(value);
        }
        return result1;
      })()))
    };

    helpers.triggerEvent(document.activeElement, "paste", {testClipboardData});
    return helpers.defer(callback);
  },

  createFile(properties) {
    if (properties == null) { properties = {}; }
    const file = {getAsFile() { return {}; }};
    for (let key in properties) { const value = properties[key]; file[key] = value; }
    return file;
  },

  typeCharacters(string, callback) {
    let characters, typeNextCharacter;
    if (Array.isArray(string)) {
      characters = string;
    } else {
      characters = string.split("");
    }

    return (typeNextCharacter = () => helpers.defer(function() {
      const character = characters.shift();
      if (character != null) {
        switch (character) {
          case "\n":
            return helpers.pressKey("return", typeNextCharacter);
          case "\b":
            return helpers.pressKey("backspace", typeNextCharacter);
          default:
            return typeCharacterInElement(character, document.activeElement, typeNextCharacter);
        }
      } else {
        return callback();
      }
    }) )();
  },

  pressKey(keyName, callback) {
    const element = document.activeElement;
    code = keyCodes[keyName];
    const properties = {which: code, keyCode: code, charCode: 0};

    if (!helpers.triggerEvent(element, "keydown", properties)) { return callback(); }

    return simulateKeypress(keyName, () =>
      helpers.defer(function() {
        helpers.triggerEvent(element, "keyup", properties);
        return helpers.defer(callback);
      })
    );
  },

  startComposition(data, callback) {
    const element = document.activeElement;
    helpers.triggerEvent(element, "compositionstart", {data: ""});
    helpers.triggerEvent(element, "compositionupdate", {data});
    helpers.triggerEvent(element, "input");

    const node = document.createTextNode(data);
    helpers.insertNode(node);
    return helpers.selectNode(node, callback);
  },

  updateComposition(data, callback) {
    const element = document.activeElement;
    helpers.triggerEvent(element, "compositionupdate", {data});
    helpers.triggerEvent(element, "input");

    const node = document.createTextNode(data);
    helpers.insertNode(node);
    return helpers.selectNode(node, callback);
  },

  endComposition(data, callback) {
    const element = document.activeElement;
    helpers.triggerEvent(element, "compositionupdate", {data});

    const node = document.createTextNode(data);
    helpers.insertNode(node);
    helpers.selectNode(node);
    return helpers.collapseSelection("right", function() {
      helpers.triggerEvent(element, "input");
      helpers.triggerEvent(element, "compositionend", {data});
      return helpers.defer(callback);
    });
  },

  clickElement(element, callback) {
    if (helpers.triggerEvent(element, "mousedown")) {
      return helpers.defer(function() {
        if (helpers.triggerEvent(element, "mouseup")) {
          return helpers.defer(function() {
            helpers.triggerEvent(element, "click");
            return helpers.defer(callback);
          });
        }
      });
    }
  },

  dragToCoordinates(coordinates, callback) {
    const element = document.activeElement;

    // IE only allows writing "text" to DataTransfer
    // https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
    const dataTransfer = {
      files: [],
      data: {},
      getData(format) {
        if (isIE && (format.toLowerCase() !== "text")) {
          throw new Error("Invalid argument.");
        } else {
          this.data[format];
          return true;
        }
      },
      setData(format, data) {
        if (isIE && (format.toLowerCase() !== "text")) {
          throw new Error("Unexpected call to method or property access.");
        } else {
          return this.data[format] = data;
        }
      }
    };

    helpers.triggerEvent(element, "mousemove");

    const dragstartData = {dataTransfer};
    helpers.triggerEvent(element, "dragstart", dragstartData);

    const dropData = {dataTransfer};
    for (let key in coordinates) { const value = coordinates[key]; dropData[key] = value; }
    helpers.triggerEvent(element, "drop", dropData);

    return helpers.defer(callback);
  },

  mouseDownOnElementAndMove(element, distance, callback) {
    const coordinates = getElementCoordinates(element);
    helpers.triggerEvent(element, "mousedown", coordinates);

    const destination = offset =>
      ({
        clientX: coordinates.clientX + offset,
        clientY: coordinates.clientY + offset
      })
    ;

    const dragSpeed = 20;

    return after(dragSpeed, function() {
      let drag;
      let offset = 0;
      return (drag = () => {
        if (++offset <= distance) {
          helpers.triggerEvent(element, "mousemove", destination(offset));
          return after(dragSpeed, drag);
        } else {
          helpers.triggerEvent(element, "mouseup", destination(distance));
          return after(dragSpeed, callback);
        }
      })();
    });
  }
});

var typeCharacterInElement = function(character, element, callback) {
  const charCode = character.charCodeAt(0);
  const keyCode = character.toUpperCase().charCodeAt(0);

  if (!helpers.triggerEvent(element, "keydown", {keyCode, charCode: 0})) { return callback(); }

  return helpers.defer(function() {
    if (!helpers.triggerEvent(element, "keypress", {keyCode: charCode, charCode})) { return callback(); }
    return insertCharacter(character, function() {
      helpers.triggerEvent(element, "input");

      return helpers.defer(function() {
        helpers.triggerEvent(element, "keyup", {keyCode, charCode: 0});
        return callback();
      });
    });
  });
};

var insertCharacter = function(character, callback) {
  const node = document.createTextNode(character);
  return helpers.insertNode(node, callback);
};

var simulateKeypress = function(keyName, callback) {
  switch (keyName) {
    case "backspace":
      return deleteInDirection("left", callback);
    case "delete":
      return deleteInDirection("right", callback);
    case "return":
      var node = document.createElement("br");
      return helpers.insertNode(node, callback);
  }
};

var deleteInDirection = function(direction, callback) {
  if (helpers.selectionIsCollapsed()) {
    getComposition().expandSelectionInDirection(direction === "left" ? "backward" : "forward");
    return helpers.defer(function() {
      helpers.deleteSelection();
      return callback();
    });
  } else {
    helpers.deleteSelection();
    return callback();
  }
};

var getElementCoordinates = function(element) {
  const rect = element.getBoundingClientRect();
  return {
    clientX: rect.left + (rect.width / 2),
    clientY: rect.top + (rect.height / 2)
  };
};
