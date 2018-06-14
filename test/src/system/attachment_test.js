/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {after, assert, clickElement, clickToolbarButton, createFile, defer, dragToCoordinates, moveCursor, pressKey, test, testGroup, triggerEvent, typeCharacters} = Trix.TestHelpers;

testGroup("Attachments", {template: "editor_with_image"}, function() {
  test("moving an image by drag and drop", expectDocument =>
    typeCharacters("!", () =>
      moveCursor({direction: "right", times: 1}, function(coordinates) {
        const img = document.activeElement.querySelector("img");
        triggerEvent(img, "mousedown");
        return defer(() =>
          dragToCoordinates(coordinates, () => expectDocument(`!a${Trix.OBJECT_REPLACEMENT_CHARACTER}b\n`))
        );
      })
    )
  );

  test("removing an image", expectDocument =>
    after(20, () =>
      clickElement(getFigure(), function() {
        const closeButton = getFigure().querySelector(`.${Trix.config.css.attachmentRemove}`);
        return clickElement(closeButton, () => expectDocument("ab\n"));
      })
    )
  );

  test("editing an image caption", expectDocument =>
    after(20, () =>
      clickElement(findElement("figure"), () =>
        clickElement(findElement("figcaption"), () =>
          defer(function() {
            const textarea = findElement("textarea");
            assert.ok(textarea);
            textarea.focus();
            textarea.value = "my caption";
            triggerEvent(textarea, "input");
            return pressKey("return", function() {
              assert.notOk(findElement("textarea"));
              assert.textAttributes([2, 3], {caption: "my caption"});
              assert.locationRange({index: 0, offset: 3});
              return expectDocument(`ab${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`);
            });
          })
        )
      )
    )
  );

  test("editing an attachment caption with no filename", done =>
    after(20, function() {
      let captionElement = findElement("figcaption");
      assert.ok(captionElement.clientHeight > 0);
      assert.equal(captionElement.getAttribute("data-trix-placeholder"), Trix.config.lang.captionPlaceholder);

      return clickElement(findElement("figure"), function() {
        captionElement = findElement("figcaption");
        assert.ok(captionElement.clientHeight > 0);
        assert.equal(captionElement.getAttribute("data-trix-placeholder"), Trix.config.lang.captionPlaceholder);
        return done();
      });
    })
  );

  test("updating an attachment's href attribute while editing its caption", function(expectDocument) {
    const attachment = getEditorController().attachmentManager.getAttachments()[0];
    return after(20, () =>
      clickElement(findElement("figure"), () =>
        clickElement(findElement("figcaption"), () =>
          defer(function() {
            let textarea = findElement("textarea");
            assert.ok(textarea);
            textarea.focus();
            textarea.value = "my caption";
            triggerEvent(textarea, "input");
            attachment.setAttributes({href: "https://example.com"});
            return defer(function() {
              textarea = findElement("textarea");
              assert.ok(document.activeElement === textarea);
              assert.equal(textarea.value, "my caption");
              return pressKey("return", function() {
                assert.notOk(findElement("textarea"));
                assert.textAttributes([2, 3], {caption: "my caption"});
                assert.locationRange({index: 0, offset: 3});
                return expectDocument(`ab${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`);
              });
            });
          })
        )
      )
    );
  });

  return testGroup("File insertion", {template: "editor_empty"}, function() {
    test("inserting a file in a formatted block", expectDocument =>
      clickToolbarButton({attribute: "bullet"}, () =>
        clickToolbarButton({attribute: "bold"}, function() {
          getComposition().insertFile(createFile());
          assert.blockAttributes([0, 1], ["bulletList", "bullet"]);
          assert.textAttributes([0, 1], {bold: true});
          return expectDocument(`${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`);
        })
      )
    );

    return test("inserting a files in a formatted block", expectDocument =>
      clickToolbarButton({attribute: "quote"}, () =>
        clickToolbarButton({attribute: "italic"}, function() {
          getComposition().insertFiles([createFile(), createFile()]);
          assert.blockAttributes([0, 2], ["quote"]);
          assert.textAttributes([0, 1], {italic: true});
          assert.textAttributes([1, 2], {italic: true});
          return expectDocument(`${Trix.OBJECT_REPLACEMENT_CHARACTER}${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`);
        })
      )
    );
  });
});

var getFigure = () => findElement("figure");

var findElement = selector => getEditorElement().querySelector(selector);
