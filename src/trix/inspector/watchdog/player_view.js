/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/watchdog/deserializer

(function() {
  let clear = undefined;
  let render = undefined;
  let select = undefined;
  const Cls = (Trix.Watchdog.PlayerView = class PlayerView {
    static initClass() {
      this.documentClassName = "trix-watchdog-player";
      this.playingClassName = "trix-watchdog-player-playing";
  
      clear = element =>
        (() => {
          const result = [];
          while (element.lastChild) {
            result.push(element.removeChild(element.lastChild));
          }
          return result;
        })()
      ;
  
      render = function(element, ...contents) {
        clear(element);
        return Array.from(contents).map((content) => element.appendChild(content));
      };
  
      select = function(document, range) {
        if (!range) { return; }
        const window = document.defaultView;
        const selection = window.getSelection();
        selection.removeAllRanges();
        return selection.addRange(range);
      };
    }

    constructor(element) {
      this.frameDidLoadDefaultDocument = this.frameDidLoadDefaultDocument.bind(this);
      this.frameDidLoadStylesheet = this.frameDidLoadStylesheet.bind(this);
      this.frameDidLoseFocus = this.frameDidLoseFocus.bind(this);
      this.didClickPlayButton = this.didClickPlayButton.bind(this);
      this.didChangeSliderValue = this.didChangeSliderValue.bind(this);
      this.updateFrame = this.updateFrame.bind(this);
      this.element = element;
      this.frame = document.createElement("iframe");
      this.frame.style.border = "none";
      this.frame.style.width = "100%";
      this.frame.onload = this.frameDidLoadDefaultDocument;
      this.frame.onblur = this.frameDidLoseFocus;

      const controlsContainer = document.createElement("div");

      this.playButton = document.createElement("button");
      this.playButton.textContent = "Play";
      this.playButton.onclick = this.didClickPlayButton;

      this.slider = document.createElement("input");
      this.slider.type = "range";
      this.slider.oninput = this.didChangeSliderValue;

      this.indexLabel = document.createElement("span");

      const logContainer = document.createElement("div");

      this.log = document.createElement("textarea");
      this.log.setAttribute("readonly", "");
      this.log.rows = 4;

      render(controlsContainer, this.playButton, this.slider, this.indexLabel);
      render(logContainer, this.log);
      render(this.element, this.frame, controlsContainer, logContainer);
      this.setIndex(0);
    }

    renderSnapshot(snapshot) {
      if (this.body) {
        const {element, range} = this.deserializeSnapshot(snapshot);
        render(this.body, element);
        select(this.document, range);
        return this.updateFrame();
      } else {
        return this.snapshot = snapshot;
      }
    }

    renderEvents(events) {
      const renderedEvents = (() => {
        const result = [];
        for (let index = events.length - 1; index >= 0; index--) {
          const event = events[index];
          result.push(this.renderEvent(event, index));
        }
        return result;
      })();
      return this.log.innerText = renderedEvents.join("\n");
    }

    setIndex(index) {
      this.slider.value = index;
      return this.indexLabel.textContent = `Frame ${index}`;
    }

    setLength(length) {
      return this.slider.max = length - 1;
    }

    playerDidStartPlaying() {
      this.element.classList.add(this.constructor.playingClassName);
      return this.playButton.textContent = "Pause";
    }

    playerDidStopPlaying() {
      this.element.classList.remove(this.constructor.playingClassName);
      return this.playButton.textContent = "Play";
    }

    frameDidLoadDefaultDocument() {
      this.document = this.frame.contentDocument;
      this.document.documentElement.classList.add(this.constructor.documentClassName);

      this.document.head.innerHTML = document.head.innerHTML;
      for (let stylesheet of Array.from(this.document.head.querySelectorAll("link[rel=stylesheet]"))) {
        stylesheet.onload = this.frameDidLoadStylesheet;
      }

      this.body = this.document.body;
      this.body.style.cssText = "margin: 0; padding: 0";
      this.body.onkeydown = event => event.preventDefault();

      if (this.snapshot) {
        this.renderSnapshot(snapshot);
        return this.snapshot = null;
      }
    }

    frameDidLoadStylesheet() {
      return this.updateFrame();
    }

    frameDidLoseFocus() {
      if (this.element.classList.contains(this.constructor.playingClassName)) {
        return requestAnimationFrame(this.updateFrame);
      }
    }

    didClickPlayButton() {
      return __guardMethod__(this.delegate, 'playerViewDidClickPlayButton', o => o.playerViewDidClickPlayButton());
    }

    didChangeSliderValue() {
      const value = parseInt(this.slider.value, 10);
      return __guardMethod__(this.delegate, 'playerViewDidChangeSliderValue', o => o.playerViewDidChangeSliderValue(value));
    }

    renderEvent(event, index) {
      const description = (() => { let left;
      switch (event.type) {
        case "input":
          return "Browser input event received";
        case "keypress":
          var key = (left = event.character != null ? event.character : event.charCode) != null ? left : event.keyCode;
          return `Key pressed: ${JSON.stringify(key)}`;
        case "log":
          return event.message;
        case "snapshot":
          return "DOM update";
      } })();

      return `[${index}] ${description}`;
    }

    deserializeSnapshot(snapshot) {
      const deserializer = new Trix.Watchdog.Deserializer(this.document, snapshot);
      return {
        element: deserializer.getElement(),
        range: deserializer.getRange()
      };
    }

    updateFrame() {
      this.frame.style.height = 0;
      this.frame.style.height = this.body.scrollHeight + "px";
      this.frame.focus();
      return this.frame.contentWindow.focus();
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