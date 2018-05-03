'use strict';

// import dependancies
import Promise from 'native-promise-only';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// import plugins
import './plugins';

// import helper functions
import Html2PdfUtils from './utils';

class Html2Pdf {

  constructor (source, options = {}) {
    if (!(this instanceof Html2Pdf)) {
      return new Html2Pdf(source, options);
    }

    this.source = '';
    this.jsPDF = {};
    this.html2canvas = {};
    this.image = {};
    this.margin = [0, 0, 0, 0];
    this.filename = '';
    this.pageSize = {};
    this.enableLinks = false;
    this.links = [];
    this._pdf = null;
    this.javascriptEnabled = false;
    this.onRendered = () => {};

    if (!!options.jsPDF && typeof options.jsPDF === 'object') {
      this.jsPDF = options.jsPDF;
    } else if (Html2Pdf.jsPDF) {
      this.jsPDF = Html2Pdf.jsPDF;
    }

    if (!!options.html2canvas && typeof options.html2canvas === 'object') {
      this.html2canvas = options.html2canvas;
      if (this.html2canvas.hasOwnProperty('onrendered')) {
        this.onRendered = this.html2canvas.onrendered;
        delete this.html2canvas.onrendered;
      }
    } else if (Html2Pdf.html2canvas) {
      this.html2canvas = Html2Pdf.html2canvas;
    }

    if (!!options.image && typeof options.image === 'object') {
      this.image = options.image;
      this.image.type = options.image.type || 'jpeg';
      this.image.quality = options.image.quality || 0.95;
    } else if (Html2Pdf.image) {
      this.image = Html2Pdf.image;
    }

    if (options.hasOwnProperty('enableLinks')) {
      this.enableLinks = options.enableLinks;
    } else if (Html2Pdf.enableLinks) {
      this.enableLinks = Html2Pdf.enableLinks;
    }

    if (options.hasOwnProperty('javascriptEnabled')) {
      this.javascriptEnabled = options.javascriptEnabled;
    } else if (Html2Pdf.javascriptEnabled) {
      this.javascriptEnabled = Html2Pdf.javascriptEnabled;
    }

    if (options.hasOwnProperty('margin')) {
      if (typeof options.margin === 'number') {
        this.margin = [options.margin, options.margin, options.margin, options.margin];
      } else if (Array.isArray(options.margin)) {
        if (options.margin.length === 2) {
          this.margin = [options.margin[0], options.margin[1], options.margin[0], options.margin[0]];
        } else if (options.margin.length === 4) {
          this.margin = options.margin;
        }
      }
    } else if (Html2Pdf.margin) {
      this.margin = Html2Pdf.margin;
    }

    if (options.hasOwnProperty('filename') && typeof options.filename === 'string') {
      if (options.filename.split('.').pop().toLowerCase() !== 'pdf') {
        this.filename = options.filename.concat('.pdf');
      } else {
        this.filename = options.filename;
      }
    } else if (Html2Pdf.filename) {
      this.filename = Html2Pdf.filename;
    }

    this.pageSize = jsPDF.getPageSize(this.jsPDF);
    this.pageSize.inner = {
      width: this.pageSize.width - this.margin[1] - this.margin[3],
      height: this.pageSize.height - this.margin[0] - this.margin[2]
    };
    this.pageSize.inner.ratio = this.pageSize.inner.height / this.pageSize.inner.width;

    if (options.hasOwnProperty('source')) {
      source = options.source;
    }

    if (!source) {
      console.warn('[Html2Pdf] source element not set (null or undefined)');
    } else if (typeof source === 'string') {
      this.source = Html2PdfUtils.createElement('div', { innerHTML: source });
    } else if (typeof source === 'object' && source.nodeType === 1) {
      this.source = Html2PdfUtils.cloneNode(source, this.javascriptEnabled);
    } else {
      console.warn('[Html2Pdf] source element not set (invalid source)');
    }
  }

  /**
   * Creates the DOM element container used for generating the PDF file.
   *
   * @returns {Element} The DOM element container.
   * @memberof Html2Pdf
   */
  createContainer () {
    // Define the CSS styles for the container and its overlay parent.
    let overlayCSS = {
      position: 'fixed', overflow: 'hidden', zIndex: 1000,
      left: 0, right: 0, bottom: 0, top: 0,
      backgroundColor: 'rgba(0,0,0,0.8)'
    };
    let containerCSS = {
      position: 'absolute', width: this.pageSize.inner.width + this.pageSize.unit,
      left: 0, right: 0, top: 0, height: 'auto', margin: 'auto',
      backgroundColor: 'white'
    };

    // Set the overlay to hidden (could be changed in the future to provide a print preview).
    overlayCSS.opacity = 0;

    // Create and attach the elements.
    let overlay = Html2PdfUtils.createElement('div', { class: 'html2pdf__overlay', style: overlayCSS });
    let container = Html2PdfUtils.createElement('div', { class: 'html2pdf__container', style: containerCSS });

    container.appendChild(this.source);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Enable page-breaks.
    let pageBreaks = this.source.querySelectorAll('.html2pdf__page-break');
    let pxPageHeight = this.pageSize.inner.height * this.pageSize.k / 72 * 96;

    Array.prototype.forEach.call(pageBreaks, (el) => {
      el.style.display = 'block';
      let clientRect = el.getBoundingClientRect();

      el.style.height = pxPageHeight - (clientRect.top % pxPageHeight) + 'px';
    });

    // Return the container.
    return container;
  };

  /**
   * Generates the PDF canvas image of a DOM element.
   *
   * @param {Element} container The DOM element containing the HTML to be rendered.
   * @returns {Promise} The promise containing the HTML canvas
   * @memberof Html2Pdf
   */
  makeCanvas (container) {
    return new Promise((resolve, reject) => {
      try {
        let overlay = container.parentElement;

        // Get the locations of all hyperlinks.
        if (this.enableLinks) {
          // Find all anchor tags and get the container's bounds for reference.
          this.links = [];
          let links = container.querySelectorAll('a');
          let containerRect = Html2PdfUtils.unitConvert(container.getBoundingClientRect(), this.pageSize.k);

          // Treat each client rect as a separate link (for text-wrapping).
          Array.prototype.forEach.call(links, (link) => {
            let clientRects = link.getClientRects();

            for (let i = 0; i < clientRects.length; i++) {
              let clientRect = Html2PdfUtils.unitConvert(clientRects[i], this.pageSize.k);

              clientRect.left -= containerRect.left;
              clientRect.top -= containerRect.top;
              this.links.push({ el: link, clientRect: clientRect });
            }
          });
        }

        html2canvas(container, this.html2canvas).then((canvas) => {
          this.onRendered(canvas);
          document.body.removeChild(overlay);
          resolve(canvas);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates the jsPDF instance
   *
   * @param {HTMLCanvasElement} canvas The HTML canvas element to be used for generating the PDF.
   * @returns {Promise} The promise containing the jsPDF instance
   * @memberof Html2Pdf
   */
  makePdf (canvas) {
    this._pdf = null;

    return new Promise((resolve, reject) => {
      try {
        // Calculate the number of pages.
        // let ctx = canvas.getContext('2d');
        let pxFullHeight = canvas.height;
        let pxPageHeight = Math.floor(canvas.width * this.pageSize.inner.ratio);
        let nPages = Math.ceil(pxFullHeight / pxPageHeight);

        // Create a one-page canvas to split up the full image.
        let pageCanvas = document.createElement('canvas');
        let pageCtx = pageCanvas.getContext('2d');
        let pageHeight = this.pageSize.inner.height;

        pageCanvas.width = canvas.width;
        pageCanvas.height = pxPageHeight;

        // Initialize the PDF.
        /* eslint new-cap:off */
        let pdf = new jsPDF(this.jsPDF);

        for (let page = 0; page < nPages; page++) {
          // Trim the final page to reduce file size.
          if (page === nPages - 1) {
            pageCanvas.height = pxFullHeight % pxPageHeight;
            pageHeight = pageCanvas.height * this.pageSize.inner.width / pageCanvas.width;
          }

          // Display the page.
          let w = pageCanvas.width;
          let h = pageCanvas.height;

          pageCtx.fillStyle = 'white';
          pageCtx.fillRect(0, 0, w, h);
          pageCtx.drawImage(canvas, 0, page * pxPageHeight, w, h, 0, 0, w, h);

          // Add the page to the PDF.
          if (page) {
            pdf.addPage();
          }
          let imgData = pageCanvas.toDataURL('image/' + this.image.type, this.image.quality);

          pdf.addImage(imgData, this.image.type, this.margin[1], this.margin[0], this.pageSize.inner.width, pageHeight);

          // Add hyperlinks.
          if (this.enableLinks) {
            let pageTop = page * this.pageSize.inner.height;

            Array.prototype.forEach.call(this.links, (link) => {
              if (link.clientRect.top > pageTop && link.clientRect.top < pageTop + this.pageSize.inner.height) {
                let left = this.margin[1] + link.clientRect.left;
                let top = this.margin[0] + link.clientRect.top - pageTop;

                pdf.link(left, top, link.clientRect.width, link.clientRect.height, { url: link.el.href });
              }
            }, this);
          }
        }
        // save the pdf object for future use
        this._pdf = pdf;
        resolve(this._pdf);
      } catch (error) {
        reject(error);
      }
    });
  }

  make () {
    return new Promise((resolve, reject) => {
      try {
        // Copy the source element into a PDF-styled container div.
        let container = this.createContainer(this.source, this.pageSize);

        this.makeCanvas(container).then((canvas) => {
          this.makePdf(canvas).then((pdf) => {
            resolve(pdf);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getPdf (download) {
    return new Promise((resolve, reject) => {
      try {
        if (this._pdf) {
          resolve(this._pdf);
        } else {
          this.make().then((pdf) => {
            if (download) {
              pdf.save(this.filename);
            }
            resolve(pdf);
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getDataUri () {
    return new Promise((resolve, reject) => {
      try {
        this.getPdf(false).then((pdf) => resolve(pdf.output('datauristring')));
      } catch (error) {
        reject(error);
      }
    });
  }

  static getPdf (options) {
    return (new Html2Pdf(null, options)).getPdf(options.download);
  }

  static downloadPdf (options) {
    return (new Html2Pdf(null, options)).getPdf(true);
  }

  static getDataUri (options) {
    return (new Html2Pdf(null, options)).getDataUri();
  }
}

Html2Pdf.margin = [10, 10, 10, 10];
Html2Pdf.jsPDF = {
  orientation: 'p',
  unit: 'mm',
  format: 'a4'
};
Html2Pdf.html2canvas = {
  scale: 2,
  logging: false
};
Html2Pdf.image = {
  type: 'jpeg',
  quality: 0.95
};
Html2Pdf.filename = 'file.pdf';
Html2Pdf.enableLinks = true;

export default Html2Pdf;
