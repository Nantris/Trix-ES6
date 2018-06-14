/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.config.textAttributes = {
  bold: {
    tagName: "strong",
    inheritable: true,
    parser(element) {
      const style = window.getComputedStyle(element);
      return (style["fontWeight"] === "bold") || (style["fontWeight"] >= 600);
    }
  },
  italic: {
    tagName: "em",
    inheritable: true,
    parser(element) {
      const style = window.getComputedStyle(element);
      return style["fontStyle"] === "italic";
    }
  },
  href: {
    groupTagName: "a",
    parser(element) {
      let link;
      const {attachmentSelector} = Trix.AttachmentView;
      const matchingSelector = `a:not(${attachmentSelector})`;
      if (link = Trix.findClosestElementFromNode(element, {matchingSelector})) {
        return link.getAttribute("href");
      }
    }
  },
  strike: {
    tagName: "del",
    inheritable: true
  },
  frozen: {
    style: { "backgroundColor": "highlight" }
  }
};
