/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.registerElement("trix-toolbar", {
  defaultCSS: `\
%t {
  white-space: nowrap;
}

%t [data-trix-dialog] {
  display: none;
}

%t [data-trix-dialog][data-trix-active] {
  display: block;
}

%t [data-trix-dialog] [data-trix-validate]:invalid {
  background-color: #ffdddd;
}\
`,

  createdCallback() {
    if (this.innerHTML === "") {
      return this.innerHTML = Trix.config.toolbar.getDefaultHTML();
    }
  }
}
);
