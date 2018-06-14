/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const defaults = {
  extendsTagName: "div",
  css: "%t { display: block; }"
};

Trix.registerElement = function(tagName, definition) {
  if (definition == null) { definition = {}; }
  tagName = tagName.toLowerCase();
  const properties = rewriteFunctionsAsValues(definition);

  const extendsTagName = properties.extendsTagName != null ? properties.extendsTagName : defaults.extendsTagName;
  delete properties.extendsTagName;

  let { defaultCSS } = properties;
  delete properties.defaultCSS;

  if ((defaultCSS != null) && (extendsTagName === defaults.extendsTagName)) {
    defaultCSS += `\n${defaults.css}`;
  } else {
    defaultCSS = defaults.css;
  }

  installDefaultCSSForTagName(defaultCSS, tagName);

  const extendedPrototype = Object.getPrototypeOf(document.createElement(extendsTagName));
  extendedPrototype.__super__ = extendedPrototype;

  const prototype = Object.create(extendedPrototype, properties);
  const constructor = document.registerElement(tagName, {prototype});
  Object.defineProperty(prototype, "constructor", {value: constructor});
  return constructor;
};

var installDefaultCSSForTagName = function(defaultCSS, tagName) {
  const styleElement = insertStyleElementForTagName(tagName);
  return styleElement.textContent = defaultCSS.replace(/%t/g, tagName);
};

var insertStyleElementForTagName = function(tagName) {
  const element = document.createElement("style");
  element.setAttribute("type", "text/css");
  element.setAttribute("data-tag-name", tagName.toLowerCase());
  document.head.insertBefore(element, document.head.firstChild);
  return element;
};

var rewriteFunctionsAsValues = function(definition) {
  const object = {};
  for (let key in definition) {
    const value = definition[key];
    object[key] = typeof value === "function" ? {value} : value;
  }
  return object;
};
