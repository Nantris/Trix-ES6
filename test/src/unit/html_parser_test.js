/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {after, assert, createCursorTarget, getHTML, test, testGroup} = Trix.TestHelpers;

const cursorTargetLeft = createCursorTarget("left").outerHTML;
const cursorTargetRight = createCursorTarget("right").outerHTML;

testGroup("Trix.HTMLParser", function() {
  eachFixture((name, {html, serializedHTML, document}) =>
    test(name, function() {
      const parsedDocument = Trix.HTMLParser.parse(html).getDocument();
      return assert.documentHTMLEqual(parsedDocument.copyUsingObjectsFromDocument(document), html);
    })
  );

  eachFixture(function(name, {html, serializedHTML, document}) {
    if (serializedHTML != null) {
      return test(`${name} (serialized)`, function() {
        const parsedDocument = Trix.HTMLParser.parse(serializedHTML).getDocument();
        return assert.documentHTMLEqual(parsedDocument.copyUsingObjectsFromDocument(document), html);
      });
    }
  });

  test("parses absolute image URLs", function() {
    const src = `${getOrigin()}/test_helpers/fixtures/logo.png`;
    const pattern = new RegExp(`src="${src}"`);
    const html = `<img src="${src}">`;

    const finalHTML = getHTML(Trix.HTMLParser.parse(html).getDocument());
    return assert.ok(pattern.test(finalHTML), `${pattern} not found in ${JSON.stringify(finalHTML)}`);
  });

  test("parses relative image URLs", function() {
    const src = "/test_helpers/fixtures/logo.png";
    const pattern = new RegExp(`src="${src}"`);
    const html = `<img src="${src}">`;

    const finalHTML = getHTML(Trix.HTMLParser.parse(html).getDocument());
    return assert.ok(pattern.test(finalHTML), `${pattern} not found in ${JSON.stringify(finalHTML)}`);
  });

  test("parses unfamiliar html", function() {
    const html = "<meta charset=\"UTF-8\"><span style=\"font-style: italic\">abc</span><span>d</span><section style=\"margin:0\"><blink>123</blink><a href=\"http://example.com\">45<b>6</b></a>x<br />y</section><p style=\"margin:0\">9</p>";
    const expectedHTML = "<div><!--block--><em>abc</em>d</div><div><!--block-->123<a href=\"http://example.com\">45<strong>6</strong></a>x<br>y</div><div><!--block-->9</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("ignores leading whitespace before <meta> tag", function() {
    const html = " \n <meta charset=\"UTF-8\"><pre>abc</pre>";
    const expectedHTML = "<pre><!--block-->abc</pre>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("ignores content after </html>", function() {
    const html = `\
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
</head>

<body lang=EN-US link=blue vlink="#954F72" style='tab-interval:.5in'>
<!--StartFragment--><span lang=EN style='font-size:12.0pt;font-family:
"Arial",sans-serif;mso-fareast-font-family:"Times New Roman";mso-ansi-language:
EN;mso-fareast-language:EN-US;mso-bidi-language:AR-SA'>abc</span><!--EndFragment-->
</body>

</html>
TAxelFCg��K��\
`;
    const expectedHTML = "<div><!--block-->abc</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("ignores whitespace between block elements", function() {
    const html = "<div>a</div> \n <div>b</div>     <article>c</article>  \n\n <section>d</section> ";
    const expectedHTML = "<div><!--block-->a</div><div><!--block-->b</div><div><!--block-->c</div><div><!--block-->d</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("ingores whitespace between nested block elements", function() {
    const html = "<ul> <li>a</li> \n  <li>b</li>  </ul><div>  <div> \n <blockquote>c</blockquote>\n </div>  \n</div>";
    const expectedHTML = "<ul><li><!--block-->a</li><li><!--block-->b</li></ul><blockquote><!--block-->c</blockquote>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("ignores inline whitespace that can't be displayed", function() {
    const html = " a  \n b    <span>c\n</span><span>d  \ne </span> f <span style=\"white-space: pre\">  g\n\n h  </span>";
    const expectedHTML = "<div><!--block-->a b c d e f &nbsp; g<br><br>&nbsp;h &nbsp;</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses significant whitespace in empty inline elements", function() {
    const html = "a<span style='mso-spacerun:yes'> </span>b<span style='mso-spacerun:yes'>  </span>c";
    const expectedHTML = "<div><!--block-->a b c</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses block elements with leading breakable whitespace", function() {
    const html = "<blockquote> <span>a</span> <blockquote>\n <strong>b</strong> <pre> <span>c</span></pre></blockquote></blockquote>";
    const expectedHTML = "<blockquote><!--block-->a<blockquote><!--block--><strong>b</strong><pre><!--block--> c</pre></blockquote></blockquote>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses block elements with leading non-breaking whitespace", function() {
    const html = "<blockquote>&nbsp;<span>a</span></blockquote>";
    const expectedHTML = "<blockquote><!--block-->&nbsp;a</blockquote>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("converts newlines to spaces", function() {
    const html = "<div>a\nb \nc \n d \n\ne</div><pre>1\n2</pre>";
    const expectedHTML = "<div><!--block-->a b c d e</div><pre><!--block-->1\n2</pre>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses entire HTML document", function() {
    const html = "<html><head><style>.bold {font-weight: bold}</style></head><body><span class=\"bold\">abc</span></body></html>";
    const expectedHTML = "<div><!--block--><strong>abc</strong></div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses inline element following block element", function() {
    const html = "<blockquote>abc</blockquote><strong>123</strong>";
    const expectedHTML = "<blockquote><!--block-->abc</blockquote><div><!--block--><strong>123</strong></div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses whitespace-only text nodes without a containing block element", function() {
    const html = "a <strong>b</strong> <em>c</em>";
    const expectedHTML = "<div><!--block-->a <strong>b</strong> <em>c</em></div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses spaces around cursor targets", function() {
    const html = `<div>a ${cursorTargetLeft}<span>b</span>${cursorTargetRight} c</div>`;
    const expectedHTML = "<div><!--block-->a b c</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("parses spanned text elements that don't have a parser function", function() {
    assert.notOk(Trix.config.textAttributes.strike.parser);
    const html = "<del>a <strong>b</strong></del>";
    const expectedHTML = "<div><!--block--><del>a </del><strong><del>b</del></strong></div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("translates tables into plain text", function() {
    const html = "<table><tr><td>a</td><td>b</td></tr><tr><td>1</td><td><p>2</p></td></tr><table>";
    const expectedHTML = "<div><!--block-->a | b<br>1 | 2</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("translates block element margins to newlines", function() {
    const html = "<p style=\"margin: 0 0 1em 0\">a</p><p style=\"margin: 0\">b</p><article style=\"margin: 1em 0 0 0\">c</article>";
    const expectedHTML = "<div><!--block-->a<br><br></div><div><!--block-->b</div><div><!--block--><br>c</div>";
    const document = Trix.HTMLParser.parse(html).getDocument();
    return assert.documentHTMLEqual(document, expectedHTML);
  });

  test("skips translating empty block element margins to newlines", function() {
    const html = "<p style=\"margin: 0 0 1em 0\">a</p><p style=\"margin: 0 0 1em 0\"><span></span></p><p style=\"margin: 0\">b</p>";
    const expectedHTML = "<div><!--block-->a<br><br></div><div><!--block--><br></div><div><!--block-->b</div>";
    const document = Trix.HTMLParser.parse(html).getDocument();
    return assert.documentHTMLEqual(document, expectedHTML);
  });

  test("ignores text nodes in script elements", function() {
    const html = "<div>a<script>alert(\"b\")</script></div>";
    const expectedHTML = "<div><!--block-->a</div>";
    return assert.documentHTMLEqual(Trix.HTMLParser.parse(html).getDocument(), expectedHTML);
  });

  test("sanitizes unsafe html", function(done) {
    window.unsanitized = [];
    Trix.HTMLParser.parse(`\
<img onload="window.unsanitized.push('img.onload');" src="${TEST_IMAGE_URL}">
<img onerror="window.unsanitized.push('img.onerror');" src="data:image/gif;base64,TOTALLYBOGUS">
<script>
  window.unsanitized.push('script tag');
</script>\
`
    );
    return after(20, function() {
      assert.deepEqual(window.unsanitized, []);
      delete window.unsanitized;
      return done();
    });
  });

  test("parses attachment caption from large html string", function(done) {
    let { html } = fixtures["image attachment with edited caption"];

    for (let i = 1; i <= 30; i++) {
      html += fixtures["image attachment"].html;
    }

    for (let n = 1; n <= 3; n++) {
      const attachmentPiece = Trix.HTMLParser.parse(html).getDocument().getAttachmentPieces()[0];
      assert.equal(attachmentPiece.getCaption(), "Example");
    }

    return done();
  });

  test("parses foreground color when configured", function() {
    const config =
      {foregroundColor: {styleProperty: "color"}};

    return withTextAttributeConfig(config, function() {
      const html = "<span style=\"color: rgb(60, 179, 113);\">green</span>";
      const expectedHTML = "<div><!--block--><span style=\"color: rgb(60, 179, 113);\">green</span></div>";
      const document = Trix.HTMLParser.parse(html).getDocument();
      return assert.documentHTMLEqual(document, expectedHTML);
    });
  });

  test("parses background color when configured", function() {
    const config =
      {backgroundColor: {styleProperty: "backgroundColor"}};

    return withTextAttributeConfig(config, function() {
      const html = "<span style=\"background-color: yellow;\">on yellow</span>";
      const expectedHTML = "<div><!--block--><span style=\"background-color: yellow;\">on yellow</span></div>";
      const document = Trix.HTMLParser.parse(html).getDocument();
      return assert.documentHTMLEqual(document, expectedHTML);
    });
  });

  test("parses configured foreground color on formatted text", function() {
    const config =
      {foregroundColor: {styleProperty: "color"}};

    return withTextAttributeConfig(config, function() {
      const html = "<strong style=\"color: rgb(60, 179, 113);\">GREEN</strong>";
      const expectedHTML = "<div><!--block--><strong style=\"color: rgb(60, 179, 113);\">GREEN</strong></div>";
      const document = Trix.HTMLParser.parse(html).getDocument();
      return assert.documentHTMLEqual(document, expectedHTML);
    });
  });

  return test("parses foreground color using configured parser function", function() {
    const config = {
      foregroundColor: {
        styleProperty: "color",
        parser(element) {
          const {color} = element.style;
          if (color === "rgb(60, 179, 113)") { return color; }
        }
      }
    };

    return withTextAttributeConfig(config, function() {
      const html = "<span style=\"color: rgb(60, 179, 113);\">green</span><span style=\"color: yellow;\">not yellow</span>";
      const expectedHTML = "<div><!--block--><span style=\"color: rgb(60, 179, 113);\">green</span>not yellow</div>";
      const document = Trix.HTMLParser.parse(html).getDocument();
      return assert.documentHTMLEqual(document, expectedHTML);
    });
  });
});

var withTextAttributeConfig = function(config, fn) {
  let value;
  if (config == null) { config = {}; }
  const {textAttributes} = Trix.config;
  const originalConfig = {};

  for (var key in config) {
    value = config[key];
    originalConfig[key] = textAttributes[key];
    textAttributes[key] = value;
  }

  try {
    return fn();
  } finally {
    for (key in originalConfig) {
      value = originalConfig[key];
      if (value) {
        textAttributes[key] = value;
      } else {
        delete textAttributes[key];
      }
    }
  }
};

var getOrigin = function() {
  const {protocol, hostname, port} = window.location;
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
};
