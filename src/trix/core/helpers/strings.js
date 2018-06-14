/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Trix.extend({
  normalizeSpaces(string) {
    return string
      .replace(new RegExp(`${Trix.ZERO_WIDTH_SPACE}`, 'g'), "")
      .replace(new RegExp(`${Trix.NON_BREAKING_SPACE}`, 'g'), " ");
  },

  normalizeNewlines(string) {
    return string.replace(/\r\n/g, "\n");
  },

  breakableWhitespacePattern: new RegExp(`[^\\S${Trix.NON_BREAKING_SPACE}]`),

  squishBreakableWhitespace(string) {
    return string
      // Replace all breakable whitespace characters with a space
      .replace(new RegExp(`${Trix.breakableWhitespacePattern.source}`, 'g'), " ")
      // Replace two or more spaces with a single space
      .replace(/\ {2,}/g, " ");
  },

  summarizeStringChange(oldString, newString) {
    let added, removed;
    oldString = Trix.UTF16String.box(oldString);
    newString = Trix.UTF16String.box(newString);

    if (newString.length < oldString.length) {
      [removed, added] = Array.from(utf16StringDifferences(oldString, newString));
    } else {
      [added, removed] = Array.from(utf16StringDifferences(newString, oldString));
    }

    return {added, removed};
  }});

var utf16StringDifferences = function(a, b) {
  if (a.isEqualTo(b)) { return ["", ""]; }

  const diffA = utf16StringDifference(a, b);
  const {length} = diffA.utf16String;

  const diffB = (() => {
    if (length) {
    const {offset} = diffA;
    const codepoints = a.codepoints.slice(0, offset).concat(a.codepoints.slice(offset + length));
    return utf16StringDifference(b, Trix.UTF16String.fromCodepoints(codepoints));
  } else {
    return utf16StringDifference(b, a);
  }
  })();

  return [diffA.utf16String.toString(), diffB.utf16String.toString()];
};

var utf16StringDifference = function(a, b) {
  let leftIndex = 0;
  let rightIndexA = a.length;
  let rightIndexB = b.length;

  while ((leftIndex < rightIndexA) && a.charAt(leftIndex).isEqualTo(b.charAt(leftIndex))) {
    leftIndex++;
  }

  while ((rightIndexA > (leftIndex + 1)) && a.charAt(rightIndexA - 1).isEqualTo(b.charAt(rightIndexB - 1))) {
    rightIndexA--;
    rightIndexB--;
  }

  return {
    utf16String: a.slice(leftIndex, rightIndexA),
    offset: leftIndex
  };
};
