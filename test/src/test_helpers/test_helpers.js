/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const helpers = Trix.TestHelpers;

const setFixtureHTML = function(html) {
  const element = findOrCreateTrixContainer();
  return element.innerHTML = html;
};

var findOrCreateTrixContainer = function() {
  let container;
  if (container = document.getElementById("trix-container")) {
    return container;
  } else {
    document.body.insertAdjacentHTML("afterbegin", "<form id=\"trix-container\"></form>");
    return document.getElementById("trix-container");
  }
};

let ready = null;

helpers.extend({
  testGroup(name, options, callback) {
    let setup, teardown, template;
    if (callback != null) {
      ({template, setup, teardown} = options);
    } else {
      callback = options;
    }

    const beforeEach = function() {
      // Ensure window is active on CI so focus and blur events are natively dispatched
      window.focus();

      ready = function(callback) {
        if (template != null) {
          let handler;
          addEventListener("trix-initialize", (handler = function({target}) {
            removeEventListener("trix-initialize", handler);
            if (target.hasAttribute("autofocus")) {
              target.editor.setSelectedRange(0);
            }
            return callback(target);
          })
          );

          return setFixtureHTML(JST[`test_helpers/fixtures/${template}`]());
        } else {
          return callback();
        }
      };
      return (typeof setup === 'function' ? setup() : undefined);
    };

    const afterEach = function() {
      if (template != null) {
        setFixtureHTML("");
      }
      return (typeof teardown === 'function' ? teardown() : undefined);
    };

    if (callback != null) {
      return QUnit.module(name, function(hooks) {
        hooks.beforeEach(beforeEach);
        hooks.afterEach(afterEach);
        return callback();
      });
    } else {
      return QUnit.module(name, {beforeEach, afterEach});
    }
  },

  test(name, callback) {
    return QUnit.test(name, function(assert) {
      const doneAsync = assert.async();

      return ready(function(element) {
        const done = function(expectedDocumentValue) {
          if (element != null) {
            if (expectedDocumentValue) {
              assert.equal(element.editor.getDocument().toString(), expectedDocumentValue);
            }
            return requestAnimationFrame(doneAsync);
          } else {
            return doneAsync();
          }
        };

        if (callback.length === 0) {
          callback();
          return done();
        } else {
          return callback(done);
        }
      });
    });
  },

  testIf(condition, ...args) {
    if (condition) {
      return helpers.test(...Array.from(args || []));
    } else {
      return helpers.skip(...Array.from(args || []));
    }
  },

  skip: QUnit.skip
});
