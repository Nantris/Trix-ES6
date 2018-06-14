/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/config/lang

const {lang} = Trix.config;
const sizes = [lang.bytes, lang.KB, lang.MB, lang.GB, lang.TB, lang.PB];

Trix.config.fileSize = {
  prefix: "IEC",
  precision: 2,

  formatter(number) {
    switch (number) {
      case 0: return `0 ${lang.bytes}`;
      case 1: return `1 ${lang.byte}`;
      default:
        var base = (() => { switch (this.prefix) {
          case "SI":  return 1000;
          case "IEC": return 1024;
        } })();
        var exp = Math.floor(Math.log(number) / Math.log(base));
        var humanSize = number / Math.pow(base, exp);
        var string = humanSize.toFixed(this.precision);
        var withoutInsignificantZeros = string.replace(/0*$/, "").replace(/\.$/, "");
        return `${withoutInsignificantZeros} ${sizes[exp]}`;
    }
  }
};
