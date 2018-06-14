/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.ImagePreloadOperation = class ImagePreloadOperation extends Trix.Operation {
  constructor(url) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.url = url;
  }

  perform(callback) {
    const image = new Image;

    image.onload = () => {
      image.width = (this.width = image.naturalWidth);
      image.height = (this.height = image.naturalHeight);
      return callback(true, image);
    };

    image.onerror = () => callback(false);

    return image.src = this.url;
  }
};
