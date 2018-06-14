/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {assert, clickToolbarButton, createFile, defer, expandSelection, moveCursor, pasteContent, pressKey, test, testGroup, triggerEvent, typeCharacters} = Trix.TestHelpers;

testGroup("Pasting", {template: "editor_empty"}, function() {
  test("paste plain text", expectDocument =>
    typeCharacters("abc", () =>
      moveCursor("left", () =>
        pasteContent("text/plain", "!", () => expectDocument("ab!c\n"))
      )
    )
  );

  test("paste simple html", expectDocument =>
    typeCharacters("abc", () =>
      moveCursor("left", () =>
        pasteContent("text/html", "&lt;", () => expectDocument("ab<c\n"))
      )
    )
  );

  test("paste complex html", expectDocument =>
    typeCharacters("abc", () =>
      moveCursor("left", () =>
        pasteContent("text/html", "<div>Hello world<br></div><div>This is a test</div>", () => expectDocument("abHello world\nThis is a test\nc\n"))
      )
    )
  );

  test("paste html in expanded selection", expectDocument =>
    typeCharacters("abc", () =>
      moveCursor("left", () =>
        expandSelection({direction: "left", times: 2}, () =>
          pasteContent("text/html", "<strong>x</strong>", function() {
            assert.selectedRange(1);
            return expectDocument("xc\n");
          })
        )
      )
    )
  );

  test("paste plain text with CRLF ", expectDocument =>
    pasteContent("text/plain", "a\r\nb\r\nc", () => expectDocument("a\nb\nc\n"))
  );

  test("paste html with CRLF ", expectDocument =>
    pasteContent("text/html", "<div>a<br></div>\r\n<div>b<br></div>\r\n<div>c<br></div>", () => expectDocument("a\nb\nc\n"))
  );

  test("prefers plain text when html lacks formatting", function(expectDocument) {
    const pasteData = {
      "text/html": "<meta charset='utf-8'>a\nb",
      "text/plain": "a\nb"
    };

    return pasteContent(pasteData, () => expectDocument("a\nb\n"));
  });

  test("prefers formatted html", function(expectDocument) {
    const pasteData = {
      "text/html": "<meta charset='utf-8'>a\n<strong>b</strong>",
      "text/plain": "a\nb"
    };

    return pasteContent(pasteData, () => expectDocument("a b\n"));
  });

  test("paste URL", expectDocument =>
    typeCharacters("a", () =>
      pasteContent("URL", "http://example.com", function() {
        assert.textAttributes([1, 18], {href: "http://example.com"});
        return expectDocument("ahttp://example.com\n");
      })
    )
  );

  test("paste URL with name", function(expectDocument) {
    const pasteData = {
      "URL": "http://example.com",
      "public.url-name": "Example",
      "text/plain": "http://example.com"
    };

    return pasteContent(pasteData, function() {
      assert.textAttributes([0, 7], {href: "http://example.com"});
      return expectDocument("Example\n");
    });
  });

  test("paste URL with name containing extraneous whitespace", function(expectDocument) {
    const pasteData = {
      "URL": "http://example.com",
      "public.url-name": "   Example from \n link  around\n\nnested \nelements ",
      "text/plain": "http://example.com"
    };

    return pasteContent(pasteData, function() {
      assert.textAttributes([0, 40], {href: "http://example.com"});
      return expectDocument("Example from link around nested elements\n");
    });
  });

  test("paste complex html into formatted block", done =>
    typeCharacters("abc", () =>
      clickToolbarButton({attribute: "quote"}, () =>
        pasteContent("text/html", "<div>Hello world<br></div><pre>This is a test</pre>", function() {
          const document = getDocument();
          assert.equal(document.getBlockCount(), 2);

          let block = document.getBlockAtIndex(0);
          assert.deepEqual(block.getAttributes(), ["quote"],
          assert.equal(block.toString(), "abcHello world\n"));

          block = document.getBlockAtIndex(1);
          assert.deepEqual(block.getAttributes(), ["quote", "code"]);
          assert.equal(block.toString(), "This is a test\n");

          return done();
        })
      )
    )
  );

  test("paste list into list", done =>
    clickToolbarButton({attribute: "bullet"}, () =>
      typeCharacters("abc\n", () =>
        pasteContent("text/html", "<ul><li>one</li><li>two</li></ul>", function() {
          const document = getDocument();
          assert.equal(document.getBlockCount(), 3);

          let block = document.getBlockAtIndex(0);
          assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
          assert.equal(block.toString(), "abc\n");

          block = document.getBlockAtIndex(1);
          assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
          assert.equal(block.toString(), "one\n");

          block = document.getBlockAtIndex(2);
          assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
          assert.equal(block.toString(), "two\n");

          return done();
        })
      )
    )
  );

  test("paste list into quote", done =>
    clickToolbarButton({attribute: "quote"}, () =>
      typeCharacters("abc", () =>
        pasteContent("text/html", "<ul><li>one</li><li>two</li></ul>", function() {
          const document = getDocument();
          assert.equal(document.getBlockCount(), 3);

          let block = document.getBlockAtIndex(0);
          assert.deepEqual(block.getAttributes(), ["quote"]);
          assert.equal(block.toString(), "abc\n");

          block = document.getBlockAtIndex(1);
          assert.deepEqual(block.getAttributes(), ["quote", "bulletList", "bullet"]);
          assert.equal(block.toString(), "one\n");

          block = document.getBlockAtIndex(2);
          assert.deepEqual(block.getAttributes(), ["quote", "bulletList", "bullet"]);
          assert.equal(block.toString(), "two\n");

          return done();
        })
      )
    )
  );

  test("paste list into quoted list", done =>
    clickToolbarButton({attribute: "quote"}, () =>
      clickToolbarButton({attribute: "bullet"}, () =>
        typeCharacters("abc\n", () =>
          pasteContent("text/html", "<ul><li>one</li><li>two</li></ul>", function() {
            const document = getDocument();
            assert.equal(document.getBlockCount(), 3);

            let block = document.getBlockAtIndex(0);
            assert.deepEqual(block.getAttributes(), ["quote", "bulletList", "bullet"]);
            assert.equal(block.toString(), "abc\n");

            block = document.getBlockAtIndex(1);
            assert.deepEqual(block.getAttributes(), ["quote", "bulletList", "bullet"]);
            assert.equal(block.toString(), "one\n");

            block = document.getBlockAtIndex(2);
            assert.deepEqual(block.getAttributes(), ["quote", "bulletList", "bullet"]);
            assert.equal(block.toString(), "two\n");

            return done();
          })
        )
      )
    )
  );

  test("paste nested list into empty list item", done =>
    clickToolbarButton({attribute: "bullet"}, () =>
      typeCharacters("y\nzz", function() {
        getSelectionManager().setLocationRange({index: 0, offset: 1});
        return defer(() =>
          pressKey("backspace", function() {
            pasteContent("text/html", "<ul><li>a<ul><li>b</li></ul></li></ul>", function() {});
            const document = getDocument();
            assert.equal(document.getBlockCount(), 3);

            let block = document.getBlockAtIndex(0);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
            assert.equal(block.toString(), "a\n");

            block = document.getBlockAtIndex(1);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet", "bulletList", "bullet"]);
            assert.equal(block.toString(), "b\n");

            block = document.getBlockAtIndex(2);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
            assert.equal(block.toString(), "zz\n");
            return done();
          })
        );
      })
    )
  );

  test("paste nested list over list item contents", done =>
    clickToolbarButton({attribute: "bullet"}, () =>
      typeCharacters("y\nzz", function() {
        getSelectionManager().setLocationRange({index: 0, offset: 1});
        return defer(() =>
          expandSelection("left", function() {
            pasteContent("text/html", "<ul><li>a<ul><li>b</li></ul></li></ul>", function() {});
            const document = getDocument();
            assert.equal(document.getBlockCount(), 3);

            let block = document.getBlockAtIndex(0);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
            assert.equal(block.toString(), "a\n");

            block = document.getBlockAtIndex(1);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet", "bulletList", "bullet"]);
            assert.equal(block.toString(), "b\n");

            block = document.getBlockAtIndex(2);
            assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
            assert.equal(block.toString(), "zz\n");
            return done();
          })
        );
      })
    )
  );

  test("paste list into empty block before list", done =>
    clickToolbarButton({attribute: "bullet"}, () =>
      typeCharacters("c", () =>
        moveCursor("left", () =>
          pressKey("return", function() {
            getSelectionManager().setLocationRange({index: 0, offset: 0});
            return defer(() =>
              pasteContent("text/html", "<ul><li>a</li><li>b</li></ul>", function() {
                const document = getDocument();
                assert.equal(document.getBlockCount(), 3);

                let block = document.getBlockAtIndex(0);
                assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
                assert.equal(block.toString(), "a\n");

                block = document.getBlockAtIndex(1);
                assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
                assert.equal(block.toString(), "b\n");

                block = document.getBlockAtIndex(2);
                assert.deepEqual(block.getAttributes(), ["bulletList", "bullet"]);
                assert.equal(block.toString(), "c\n");
                return done();
              })
            );
          })
        )
      )
    )
  );

  test("paste file", expectDocument =>
    typeCharacters("a", () =>
      pasteContent("Files", (createFile()), () => expectDocument(`a${Trix.OBJECT_REPLACEMENT_CHARACTER}\n`))
    )
  );

  return test("paste event with no clipboardData", expectDocument =>
    typeCharacters("a", function() {
      triggerEvent(document.activeElement, "paste");
      document.activeElement.insertAdjacentHTML("beforeend", "<span>bc</span>");
      return requestAnimationFrame(() => expectDocument("abc\n"));
    })
  );
});
