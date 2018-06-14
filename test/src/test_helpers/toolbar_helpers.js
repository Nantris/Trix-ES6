/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const helpers = Trix.TestHelpers;

helpers.extend({
  clickToolbarButton(selector, callback) {
    Trix.selectionChangeObserver.update();
    const button = getToolbarButton(selector);
    helpers.triggerEvent(button, "mousedown");
    return helpers.defer(callback);
  },

  typeToolbarKeyCommand(selector, callback) {
    let trixKey;
    const button = getToolbarButton(selector);
    if ({trixKey} = button.dataset) {
      const keyCode = trixKey.toUpperCase().charCodeAt(0);
      helpers.triggerEvent(getEditorElement(), "keydown", {keyCode, charCode: 0, metaKey: true, ctrlKey: true});
    }
    return helpers.defer(callback);
  },

  clickToolbarDialogButton({method}, callback) {
    const button = getToolbarElement().querySelector(`[data-trix-dialog] [data-trix-method='${method}']`);
    helpers.triggerEvent(button, "click");
    return helpers.defer(callback);
  },

  isToolbarButtonActive(selector) {
    const button = getToolbarButton(selector);
    return button.hasAttribute("data-trix-active") && button.classList.contains("trix-active");
  },

  isToolbarButtonDisabled(selector) {
    return getToolbarButton(selector).disabled;
  },

  typeInToolbarDialog(string, {attribute}, callback) {
    const dialog = getToolbarDialog({attribute});
    const input = dialog.querySelector(`[data-trix-input][name='${attribute}']`);
    const button = dialog.querySelector("[data-trix-method='setAttribute']");
    input.value = string;
    helpers.triggerEvent(button, "click");
    return helpers.defer(callback);
  },

  isToolbarDialogActive(selector) {
    const dialog = getToolbarDialog(selector);
    return dialog.hasAttribute("data-trix-active") && dialog.classList.contains("trix-active");
  }
});

var getToolbarButton = ({attribute, action}) => getToolbarElement().querySelector(`[data-trix-attribute='${attribute}'], [data-trix-action='${action}']`);

var getToolbarDialog = ({attribute, action}) => getToolbarElement().querySelector(`[data-trix-dialog='${attribute}']`);
