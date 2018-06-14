/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/models/managed_attachment

Trix.AttachmentManager = class AttachmentManager extends Trix.BasicObject {
  constructor(attachments) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    if (attachments == null) { attachments = []; }
    this.managedAttachments = {};
    for (let attachment of Array.from(attachments)) { this.manageAttachment(attachment); }
  }

  getAttachments() {
    return (() => {
      const result = [];
      for (let id in this.managedAttachments) {
        const attachment = this.managedAttachments[id];
        result.push(attachment);
      }
      return result;
    })();
  }

  manageAttachment(attachment) {
    return this.managedAttachments[attachment.id] != null ? this.managedAttachments[attachment.id] : (this.managedAttachments[attachment.id] = new Trix.ManagedAttachment(this, attachment));
  }

  attachmentIsManaged(attachment) {
    return attachment.id in this.managedAttachments;
  }

  requestRemovalOfAttachment(attachment) {
    if (this.attachmentIsManaged(attachment)) {
      return __guardMethod__(this.delegate, 'attachmentManagerDidRequestRemovalOfAttachment', o => o.attachmentManagerDidRequestRemovalOfAttachment(attachment));
    }
  }

  unmanageAttachment(attachment) {
    const managedAttachment = this.managedAttachments[attachment.id];
    delete this.managedAttachments[attachment.id];
    return managedAttachment;
  }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}