'use strict';

export default class Html2PdfUtils {

  /**
   * Creates a DOM element with optional attributes and children elements.
   *
   * @static
   * @param {String} tag The DOM element tag name
   * @param {any} args The DOM element attributes and / or children nodes
   * @returns {Element} The DOM element
   * @memberof Html2PdfUtils
   */
  static createElement (tag, ...args) {
    let el = document.createElement(tag);
    let attributes = {};

    // check if there are attributes defined
    if (args[0].constructor === Object) {
      attributes = args[0];
      // ...and remove them from args
      args = args.slice(1);
    }
    // check if HTML style is defined as object
    if (!!attributes.style && typeof attributes.style === 'object') {
      // transform the style object into string
      attributes.style = Object.keys(attributes.style).map((key) => {
        return `${key}:${attributes.style[key]}`;
      }).join(';');
    }
    // check if innerHTML is defined
    if (attributes.hasOwnProperty('innerHTML')) {
      // ...and delete the original innerHTML property
      el.innerHTML = attributes.innerHTML;
      delete attributes.innerHTML;
    } else {
      // create HTML element with supplied attributes and children (if any)
      Array.prototype.forEach.call(args, (arg) => {
        if (typeof arg === 'string') {
          el.appendChild(document.createTextNode(arg));
        } else if (!!arg && typeof arg === 'object' && arg.nodeType) {
          el.appendChild(arg);
        }
      });
    }

    Array.prototype.forEach.call(Object.keys(attributes), (key) => {
      el.setAttribute(key, attributes[key]);
    });

    // return the created HTML element
    return el;
  }

  /**
   * Deep-clone a DOM node and preserve contents / properties.
   *
   * @static
   * @param {Element} node The DOM node to clone
   * @param {Boolean} javascriptEnabled Clone script nodes
   * @returns {Element} The cloned DOM node
   * @memberof Html2PdfUtils
   */
  static cloneNode (node, javascriptEnabled) {
    // Recursively clone the node.
    let clone = node.nodeType === 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);

    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (javascriptEnabled === true || child.nodeType !== 1 || child.nodeName !== 'SCRIPT') {
        clone.appendChild(Html2PdfUtils.cloneNode(child, javascriptEnabled));
      }
    }

    if (node.nodeType === 1) {
      // Preserve contents/properties of special nodes.
      if (node.nodeName === 'CANVAS') {
        clone.width = node.width;
        clone.height = node.height;
        clone.getContext('2d').drawImage(node, 0, 0);
      } else if (node.nodeName === 'TEXTAREA' || node.nodeName === 'SELECT') {
        clone.value = node.value;
      }

      // Preserve the node's scroll position when it loads.
      clone.addEventListener('load', () => {
        clone.scrollTop = node.scrollTop;
        clone.scrollLeft = node.scrollLeft;
      }, true);
    }

    // Return the cloned node.
    return clone;
  }

  static unitConvert (obj, k) {
    let o = {};

    for (let key in obj) {
      o[key] = obj[key] * 72 / 96 / k;
    }
    return o;
  }
}
