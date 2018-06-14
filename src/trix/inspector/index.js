/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require_tree ./polyfills
//= require_self
//= require ./element
//= require ./control_element
//= require_tree ./templates
//= require_tree ./views

Trix.Inspector = {
  views: [],

  registerView(constructor) {
    return this.views.push(constructor);
  },

  install(editorElement) {
    this.editorElement = editorElement;
    const element = document.createElement("trix-inspector");
    element.dataset.trixId = this.editorElement.trixId;
    return document.body.appendChild(element);
  }
};
