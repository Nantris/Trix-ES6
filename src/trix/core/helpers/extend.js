/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.extend = function(properties) {
  for (let key in properties) {
    const value = properties[key];
    this[key] = value;
  }
  return this;
};
