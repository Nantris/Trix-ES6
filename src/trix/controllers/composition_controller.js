/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/controllers/attachment_editor_controller
//= require trix/views/document_view

const {handleEvent, innerElementIsActive, defer}  = Trix;

const {attachmentSelector} = Trix.AttachmentView;

Trix.CompositionController = class CompositionController extends Trix.BasicObject {
  constructor(element, composition) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.didFocus = this.didFocus.bind(this);
    this.didBlur = this.didBlur.bind(this);
    this.didClickAttachment = this.didClickAttachment.bind(this);
    this.element = element;
    this.composition = composition;
    this.documentView = new Trix.DocumentView(this.composition.document, {element: this.element});

    handleEvent("focus", {onElement: this.element, withCallback: this.didFocus});
    handleEvent("blur", {onElement: this.element, withCallback: this.didBlur});
    handleEvent("click", {onElement: this.element, matchingSelector: "a[contenteditable=false]", preventDefault: true});
    handleEvent("mousedown", {onElement: this.element, matchingSelector: attachmentSelector, withCallback: this.didClickAttachment});
    handleEvent("click", {onElement: this.element, matchingSelector: `a${attachmentSelector}`, preventDefault: true});
  }

  didFocus(event) {
    let left;
    const perform = () => {
      if (!this.focused) {
        this.focused = true;
        return __guardMethod__(this.delegate, 'compositionControllerDidFocus', o => o.compositionControllerDidFocus());
      }
    };

    return (left = (this.blurPromise != null ? this.blurPromise.then(perform) : undefined)) != null ? left : perform();
  }

  didBlur(event) {
    return this.blurPromise = new Promise(resolve => {
      return defer(() => {
        if (!innerElementIsActive(this.element)) {
          this.focused = null;
          __guardMethod__(this.delegate, 'compositionControllerDidBlur', o => o.compositionControllerDidBlur());
        }
        this.blurPromise = null;
        return resolve();
      });
    });
  }

  didClickAttachment(event, target) {
    const attachment = this.findAttachmentForElement(target);
    return __guardMethod__(this.delegate, 'compositionControllerDidSelectAttachment', o => o.compositionControllerDidSelectAttachment(attachment));
  }

  getSerializableElement() {
    if (this.isEditingAttachment()) {
      return this.documentView.shadowElement;
    } else {
      return this.element;
    }
  }

  render() {
    if (this.revision !== this.composition.revision) {
      this.documentView.setDocument(this.composition.document);
      this.documentView.render();
      this.revision = this.composition.revision;
    }

    if (this.canSyncDocumentView() && !this.documentView.isSynced()) {
      __guardMethod__(this.delegate, 'compositionControllerWillSyncDocumentView', o => o.compositionControllerWillSyncDocumentView());
      this.documentView.sync();
      __guardMethod__(this.delegate, 'compositionControllerDidSyncDocumentView', o1 => o1.compositionControllerDidSyncDocumentView());
    }

    return __guardMethod__(this.delegate, 'compositionControllerDidRender', o2 => o2.compositionControllerDidRender());
  }

  rerenderViewForObject(object) {
    this.invalidateViewForObject(object);
    return this.render();
  }

  invalidateViewForObject(object) {
    return this.documentView.invalidateViewForObject(object);
  }

  isViewCachingEnabled() {
    return this.documentView.isViewCachingEnabled();
  }

  enableViewCaching() {
    return this.documentView.enableViewCaching();
  }

  disableViewCaching() {
    return this.documentView.disableViewCaching();
  }

  refreshViewCache() {
    return this.documentView.garbageCollectCachedViews();
  }

  // Attachment editor management

  isEditingAttachment() {
    return (this.attachmentEditor != null);
  }

  installAttachmentEditorForAttachment(attachment) {
    let element;
    if ((this.attachmentEditor != null ? this.attachmentEditor.attachment : undefined) === attachment) { return; }
    if (!(element = this.documentView.findElementForObject(attachment))) { return; }
    this.uninstallAttachmentEditor();
    const attachmentPiece = this.composition.document.getAttachmentPieceForAttachment(attachment);
    this.attachmentEditor = new Trix.AttachmentEditorController(attachmentPiece, element, this.element);
    return this.attachmentEditor.delegate = this;
  }

  uninstallAttachmentEditor() {
    return (this.attachmentEditor != null ? this.attachmentEditor.uninstall() : undefined);
  }

  editAttachmentCaption() {
    return (this.attachmentEditor != null ? this.attachmentEditor.editCaption() : undefined);
  }

  // Attachment controller delegate

  didUninstallAttachmentEditor() {
    this.attachmentEditor = null;
    return this.render();
  }

  attachmentEditorDidRequestUpdatingAttributesForAttachment(attributes, attachment) {
    __guardMethod__(this.delegate, 'compositionControllerWillUpdateAttachment', o => o.compositionControllerWillUpdateAttachment(attachment));
    return this.composition.updateAttributesForAttachment(attributes, attachment);
  }

  attachmentEditorDidRequestRemovingAttributeForAttachment(attribute, attachment) {
    __guardMethod__(this.delegate, 'compositionControllerWillUpdateAttachment', o => o.compositionControllerWillUpdateAttachment(attachment));
    return this.composition.removeAttributeForAttachment(attribute, attachment);
  }

  attachmentEditorDidRequestRemovalOfAttachment(attachment) {
    return __guardMethod__(this.delegate, 'compositionControllerDidRequestRemovalOfAttachment', o => o.compositionControllerDidRequestRemovalOfAttachment(attachment));
  }

  attachmentEditorDidRequestDeselectingAttachment(attachment) {
    return __guardMethod__(this.delegate, 'compositionControllerDidRequestDeselectingAttachment', o => o.compositionControllerDidRequestDeselectingAttachment(attachment));
  }

  // Private

  canSyncDocumentView() {
    return !this.isEditingAttachment();
  }

  findAttachmentForElement(element) {
    return this.composition.document.getAttachmentById(parseInt(element.dataset.trixId, 10));
  }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}