/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.FileVerificationOperation = class FileVerificationOperation extends Trix.Operation {
  constructor(file) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.file = file;
  }

  perform(callback) {
    const reader = new FileReader;

    reader.onerror = () => callback(false);

    reader.onload = () => {
      reader.onerror = null;
      try { reader.abort(); } catch (error) {}
      return callback(true, this.file);
    };

    return reader.readAsArrayBuffer(this.file);
  }
};
