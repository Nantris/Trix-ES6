/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
(function() {
  let parseProxyMethodExpression = undefined;
  let proxyMethodExpressionPattern = undefined;
  const Cls = (Trix.BasicObject = class BasicObject {
    static initClass() {
  
      parseProxyMethodExpression = function(expression) {
        let match;
        if (!(match = expression.match(proxyMethodExpressionPattern))) {
          throw new Error(`can't parse @proxyMethod expression: ${expression}`);
        }
  
        const args = {name: match[4]};
  
        if (match[2] != null) {
          args.toMethod = match[1];
        } else {
          args.toProperty = match[1];
        }
  
        if (match[3] != null) {
          args.optional = true;
        }
  
        return args;
      };
  
      const {apply} = Function.prototype;
  
      proxyMethodExpressionPattern = new RegExp(`\
^\
(.+?)\
(\\(\\))?\
(\\?)?\
\\.\
(.+?)\
$\
`);
    }
    static proxyMethod(expression) {
      const {name, toMethod, toProperty, optional} = parseProxyMethodExpression(expression);

      return this.prototype[name] = function() {
        let subject;
        const object = (() => {
          if (toMethod != null) {
          if (optional) { return (typeof this[toMethod] === 'function' ? this[toMethod]() : undefined); } else { return this[toMethod](); }
        } else if (toProperty != null) {
          return this[toProperty];
        }
        })();

        if (optional) {
          subject = object != null ? object[name] : undefined;
          if (subject != null) { return apply.call(subject, object, arguments); }
        } else {
          subject = object[name];
          return apply.call(subject, object, arguments);
        }
      };
    }
  });
  Cls.initClass();
  return Cls;
})();
