/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let allAttributeNames = null;
let blockAttributeNames = null;
let textAttributeNames = null;
let listAttributeNames = null;

Trix.extend({
  getAllAttributeNames() {
    return allAttributeNames != null ? allAttributeNames : (allAttributeNames = Trix.getTextAttributeNames().concat(Trix.getBlockAttributeNames()));
  },

  getBlockConfig(attributeName) {
    return Trix.config.blockAttributes[attributeName];
  },

  getBlockAttributeNames() {
    return blockAttributeNames != null ? blockAttributeNames : (blockAttributeNames = Object.keys(Trix.config.blockAttributes));
  },

  getTextConfig(attributeName) {
    return Trix.config.textAttributes[attributeName];
  },

  getTextAttributeNames() {
    return textAttributeNames != null ? textAttributeNames : (textAttributeNames = Object.keys(Trix.config.textAttributes));
  },

  getListAttributeNames() {
    return listAttributeNames != null ? listAttributeNames : (listAttributeNames = ((() => {
      const result = [];
      for (let key in Trix.config.blockAttributes) {
        const {listAttribute} = Trix.config.blockAttributes[key];
        if (listAttribute != null) {
          result.push(listAttribute);
        }
      }
      return result;
    })()));
  }
});
