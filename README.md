# nr-pdf-tools

An npm module that allows you to perform a variety of activities on a PDF document:

* Split out all the pages of a document into separate documents, one per page.
* Create a single PDF document out of many PDF documents.
* Rotate all the pages of a PDF document.
* Extract any text contained within a PDF document.
* OCR a PDF Document and return the text found.
* Create an image from the PDF document. 

## Installing

To install 'nr-pdf-tools':

    npm install nr-pdf-tools

## Examples

Split out all the pages in a document.

    var tools = require('nr-pdf-tools');

    tools.splitDocument('docToSplit.pdf', 'pageDirectory').
      then(function(pageDir) {
        // pageDir is the directory that contains the split out pages
      }).
      catch(function(err) {
        // Deal with the error
      });

Combine a bunch of PDFs into a single document.

    var tools = require('nr-pdf-tools');

    var pdfsToCombine = [ 'doc1.pdf', 'doc2.pdf' ];
    tools.createDocument('pdfDirectory', pdfsToCombine, 'newFile.pdf').
      then(function(nameOfOutFile) {
        // Deal with the newly created document
      }).
      catch(function(err) {
        // Deal with the error
      });

Rotate the pages of the PDF document 90 degrees clockwise.

    var tools = require('nr-pdf-tools');

    tools.rotateDocument('pdfDirectory', 'pdfToRotate.pdf', 'rotated.pf', 'east').
      then(function() {
        // Done rotating. Do something...
      }).
      catch(function(err) {
        // Deal with the error
      });

Extract the text from a PDF.

    var tools = require('nr-pdf-tools');

    tools.pdfWords('/tmp/doc.pdf').
      then(function(extractedText) {
        // Do something with the extracted text.
      }).
      catch(function(err) {
        // Deal with the error
      });

Perform an OCR operation on a PDF document.

    var tools = require('nr-pdf-tools');

    tools.ocrPdf('/tmp/docToOcr.pdf').
      then(function(ocrText) {
        // Deal with the text we OCR'ed
      }).
      catch(function(err) {
        // Deal with the error
      });

Convert the first page of a PDF to an image.

    var tools = require('nr-pdf-tools');

    tools.pdfToImage('pdfDirectory', '-depth 4 -type Grayscale', 'doc.pdf', 'doc.png').
      then(function(pathToImage) {
        // Do something with the image
      }).
      catch(function(err) {
        // Deal with the error
      });

