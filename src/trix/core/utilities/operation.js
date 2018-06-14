/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Cls = (Trix.Operation = class Operation extends Trix.BasicObject {
  static initClass() {
  
    this.proxyMethod("getPromise().then");
    this.proxyMethod("getPromise().catch");
  }
  isPerforming() {
    return this.performing === true;
  }

  hasPerformed() {
    return this.performed === true;
  }

  hasSucceeded() {
    return this.performed && this.succeeded;
  }

  hasFailed() {
    return this.performed && !this.succeeded;
  }

  getPromise() {
    return this.promise != null ? this.promise : (this.promise = new Promise((resolve, reject) => {
      this.performing = true;
      return this.perform((succeeded, result) => {
        this.succeeded = succeeded;
        this.performing = false;
        this.performed = true;

        if (this.succeeded) {
          return resolve(result);
        } else {
          return reject(result);
        }
      });
    }));
  }

  perform(callback) {
    return callback(false);
  }

  release() {
    __guardMethod__(this.promise, 'cancel', o => o.cancel());
    this.promise = null;
    this.performing = null;
    this.performed = null;
    return this.succeeded = null;
  }
});
Cls.initClass();

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}