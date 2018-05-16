# html2pdf

[Live Demo](https://js-html2pdf.stackblitz.io/)

Based on [eKoopmans/html2pdf](https://github.com/eKoopmans/html2pdf)

html2pdf converts any webpage or element into a printable PDF entirely client-side using [html2canvas](https://github.com/niklasvh/html2canvas) and [jsPDF](https://github.com/MrRio/jsPDF).

## Getting started

#### HTML

The simplest way to use html2pdf is to download `lib/html2pdf.min.js` to your project folder and include it in your HTML with:

```html
<script src="html2pdf.min.js"></script>
```

#### NPM

Install html2pdf and its dependencies using NPM with `npm install --save js-html2pdf`.

*Note: You can use NPM to create your project, but html2pdf **will not run in Node.js**, it must be run in a browser.*

## Usage

Once installed, html2pdf is ready to use. You can create an instance of the html2pdf class or just use its static methods for one time use:

```js
// Get the element to print
var element = document.getElementById('element-to-print');

// Define optional configuration
var options = {
  filename: 'my-file.pdf'
};

// Create instance of html2pdf class
var exporter = new html2pdf(element, options);

// Download the PDF or...
exporter.getPdf(true).then((pdf) => {
  console.log('pdf file downloaded');
});

// Get the jsPDF object to work with it
exporter.getPdf(false).then((pdf) => {
  console.log('doing something before downloading pdf file');
  pdf.save();
});

// You can also use static methods for one time use...
options.source = element;
options.download = true;
html2pdf.getPdf(options);
```

The same goes when installing it through NPM

```js
// Import the library
import Html2Pdf from 'js-html2pdf';

var exporter = new Html2Pdf(element, options);

Html2Pdf.getPdf(options);
```

## Options

html2pdf can be configured using an optional `options` parameter:

```js
var element = document.getElementById('element-to-print');

html2pdf(element, {
  margin:       10,
  filename:     'myfile.pdf',
  image:        { type: 'jpeg', quality: 0.98 },
  html2canvas:  { scale: 2, logging: true, dpi: 192, letterRendering: true },
  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
});
```

The `options` parameter has the following optional fields:

|Name        |Type            |Default                       |Description                                                                                                 |
|------------|----------------|------------------------------|------------------------------------------------------------------------------------------------------------|
|source      |Element         |undefined                     |The HTML element to export to PDF (required when using static methods). |
|margin      |number or array |[10, 10, 10, 10]                             |PDF margin (in jsPDF units). Can be a single number, `[vMargin, hMargin]`, or `[top, left, bottom, right]`. |
|filename    |string          |'file.pdf'                                   |The default filename of the exported PDF.                                                                   |
|image       |object          |{type: 'jpeg', quality: 0.95}                |The image type and quality used to generate the PDF. See the Extra Features section below.                  |
|enableLinks |boolean         |true                                         |If enabled, PDF hyperlinks are automatically added ontop of all anchor tags.                                |
|html2canvas |object          |{scale: 2, logging: false}                   |Configuration options sent directly to `html2canvas` ([see here](https://html2canvas.hertzen.com/configuration) for usage).|
|jsPDF       |object          |{unit: 'mm', format: 'a4', orientation: 'p'} |Configuration options sent directly to `jsPDF` ([see here](http://rawgit.com/MrRio/jsPDF/master/docs/jsPDF.html) for usage).|

### Page-breaks

You may add `html2pdf`-specific page-breaks to your document by adding the CSS class `html2pdf__page-break` to any element (normally an empty `div`). For React elements, use `className=html2pdf__page-break`. During PDF creation, these elements will be given a height calculated to fill the remainder of the PDF page that they are on. Example usage:

```html
<div id="element-to-print">
  <span>I'm on page 1!</span>
  <div class="html2pdf__page-break"></div>
  <span>I'm on page 2!</span>
</div>
```

### Image type and quality

You may customize the image type and quality exported from the canvas by setting the `image` option. This must be an object with the following fields:

|Name        |Type            |Default                       |Description                                                                                  |
|------------|----------------|------------------------------|---------------------------------------------------------------------------------------------|
|type        |string          |'jpeg'                        |The image type. HTMLCanvasElement only supports 'png', 'jpeg', and 'webp' (on Chrome).       |
|quality     |number          |0.95                          |The image quality, from 0 to 1. This setting is only used for jpeg/webp (not png).           |

These options are limited to the available settings for [HTMLCanvasElement.toDataURL()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL), which ignores quality settings for 'png' images. To enable png image compression, try using the [canvas-png-compression shim](https://github.com/ShyykoSerhiy/canvas-png-compression), which should be an in-place solution to enable png compression via the `quality` option.

## Dependencies

html2pdf depends on the external packages [html2canvas](https://github.com/niklasvh/html2canvas), [jsPDF](https://github.com/MrRio/jsPDF), and [native-promise-only](https://github.com/getify/native-promise-only). These dependencies are automatically loaded when using NPM or the bundled package.

## Contributing

### Issues

When submitting an issue, please provide reproducible code that highlights the issue, preferably by creating a fork of [this template in StackBlitz](https://stackblitz.com/edit/js-html2pdf) (which has html2pdf already loaded). Remember that html2pdf uses [html2canvas](https://github.com/niklasvh/html2canvas) and [jsPDF](https://github.com/MrRio/jsPDF) as dependencies, so it's a good idea to check each of those repositories' issue trackers to see if your problem has already been addressed.

## Credits

[Alfredo Irarrazaval](https://github.com/airarrazaval)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2018 Alfredo Irarrazaval