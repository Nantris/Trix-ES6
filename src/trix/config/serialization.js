/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const unserializableElementSelector = "[data-trix-serialize=false]";
const unserializableAttributeNames = ["contenteditable", "data-trix-id", "data-trix-store-key", "data-trix-mutable", "data-trix-placeholder", "tabindex"];
const serializedAttributesAttribute = "data-trix-serialized-attributes";
const serializedAttributesSelector = `[${serializedAttributesAttribute}]`;

const blockCommentPattern = new RegExp("<!--block-->", "g");

Trix.extend({
  serializers: {
    "application/json"(serializable) {
      let document;
      if (serializable instanceof Trix.Document) {
        document = serializable;
      } else if (serializable instanceof HTMLElement) {
        document = Trix.Document.fromHTML(serializable.innerHTML);
      } else {
        throw new Error("unserializable object");
      }

      return document.toSerializableDocument().toJSONString();
    },

    "text/html"(serializable) {
      let element;
      if (serializable instanceof Trix.Document) {
        element = Trix.DocumentView.render(serializable);
      } else if (serializable instanceof HTMLElement) {
        element = serializable.cloneNode(true);
      } else {
        throw new Error("unserializable object");
      }

      // Remove unserializable elements
      for (var el of Array.from(element.querySelectorAll(unserializableElementSelector))) {
        el.parentNode.removeChild(el);
      }

      // Remove unserializable attributes
      for (let attribute of Array.from(unserializableAttributeNames)) {
        for (el of Array.from(element.querySelectorAll(`[${attribute}]`))) {
          el.removeAttribute(attribute);
        }
      }

      // Rewrite elements with serialized attribute overrides
      for (el of Array.from(element.querySelectorAll(serializedAttributesSelector))) { try {
        const attributes = JSON.parse(el.getAttribute(serializedAttributesAttribute));
        el.removeAttribute(serializedAttributesAttribute);
        for (let name in attributes) {
          const value = attributes[name];
          el.setAttribute(name, value);
        }
      } catch (error) {} }

      return element.innerHTML.replace(blockCommentPattern, "");
    }
  },

  deserializers: {
    "application/json"(string) {
      return Trix.Document.fromJSONString(string);
    },

    "text/html"(string) {
      return Trix.Document.fromHTML(string);
    }
  },

  serializeToContentType(serializable, contentType) {
    let serializer;
    if (serializer = Trix.serializers[contentType]) {
      return serializer(serializable);
    } else {
      throw new Error(`unknown content type: ${contentType}`);
    }
  },

  deserializeFromContentType(string, contentType) {
    let deserializer;
    if (deserializer = Trix.deserializers[contentType]) {
      return deserializer(string);
    } else {
      throw new Error(`unknown content type: ${contentType}`);
    }
  }
});
