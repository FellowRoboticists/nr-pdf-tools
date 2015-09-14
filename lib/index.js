module.exports = (function() {
  var pexec = require('@naiveroboticist/pexec');
  var compile = require('string-template/compile');
  var path = require('path');

  var quoteString = compile('"{0}"');
  var pdftkBurstTemplate = compile("pdftk {0} burst output {1}");
  var pdftkCreateTemplate = compile("(cd {0}; pdftk {1} cat output {2})");
  var pdftkRotateTemplate = compile("(cd {0}; pdftk {1} cat 1-end{2} output {3})");
  var imgGenerate = compile("(cd {0}; convert {1} {2}[0] {3})");
  var pdftotextExtract = compile("pdftotext {0} -");
  var egrepFilterRe = compile("egrep -o '{0}'");
  var trEliminateNewline = "tr '\\n' ' '";
  var tesseractImage = compile("tesseract {0} stdout");
  var gsOcrPrep = compile("gs -dSAFER -sDEVICE=png16m -dINTERPOLATE -dNumRenderingThreads=2 -dFirstPage=1 -dLastPage=1 -r300 -o {1} -c 30000000 setvmthreshold -f {0}");
  var identifySize = compile("identify {0} | cut -d ' ' -f 3");

  /**
   * Uses ImageMagick's identify to determine width/height of an image.
   *
   * imageFullPath - the fully qualified path to the image.
   *
   * returns object containing the width/height of the image.
   *
   * { width: <width>, height: <height> }
   */
  var identifyImageSize = function(imageFullPath) {
    var cmd = identifySize(quoteString(imageFullPath));
    return pexec.pexec(cmd).
      then(function(res) {
        var vals = res.stdout.split('x');
        return { width: parseInt(vals[0]), height: parseInt(vals[1]) };
      });
  };

  /**
   * Uses pdftk to split a PDF document into its component pages.
   *
   * docToSplit - full path to the PDF file to split.
   * pageDir - full path to the directory in which to place the page PDFs.
   */
  var splitDocument = function(docToSplit, pageDir) {
    var cmd = pdftkBurstTemplate(quoteString(docToSplit), 
                                 path.join(pageDir, "page_%04d.pdf"));
    return pexec.pexec(cmd).
      then(function(res) { return pageDir; });
  };

  /**
   * Uses pdftk to create a new PDF document by concatenating the 
   * specified input PDF documents.
   *
   * dirName - full path to the directory in which the docs to be concatenated are located
   * inFiles - array of file names to be merged into the new document
   * outFile - the full path to the location of the document to be created
   */
  var createDocument = function(dirName, inFiles, outFile) {
    var cmd = pdftkCreateTemplate(dirName,
                                  inFiles.map(function(f) { return quoteString(f) }).join(' '),
                                  outFile);
    return pexec.pexec(cmd).
      then(function(res) { return outFile; });
  };

  /**
   * Uses pdftk to rotate all pages in a PDF document in the specified direction.
   *
   * dirName - The directory that contains the file to rotate
   * inFile - The name of the file to rotate
   * outFile - The name of the rotated file to create in the dirName
   * direction - The direction the pages should be rotated:
   *   'east' - will rotate the document CC 90 degrees
   *   'west' - will rotate the document CCW 90 degrees
   *   'south' - will rotate the document 180 degrees
   */
  var rotateDocument = function(dirName, inFile, outFile, direction) {
    var cmd = pdftkRotateTemplate(dirName,
                                  inFile,
                                  direction,
                                  outFile);
    return pexec.pexec(cmd);
  };

  var pdfWords = function(pdfFile, filterRe, removeNewline) {
    var cmd = pdftotextExtract(pdfFile);
    if (filterRe) {
      cmd += " | " + egrepFilterRe(filterRe);
    }
    if (removeNewline) {
      cmd += " | " + trEliminateNewline;
    }
    return pexec.pexec(cmd).
      then(function(res) { return res.stdout; });
  };

  var prepPdfForOcr = function(pdfPath, imgPath) {
    if (typeof imgPath === 'undefined') {
      // No image path was specified, need to create one using the
      // same path as the PDF.
      imgPath = path.join(path.dirname(pdfPath), path.basename(pdfPath) + ".png");
    }
    var cmd = gsOcrPrep(pdfPath, imgPath);
    return pexec.pexec(cmd).
      then(function() {
        return imgPath;
      });
  };

  var ocrImage = function(imgFile, filterRe, removeNewline) {
    var cmd = tesseractImage(imgFile);
    if (filterRe) {
      cmd += " | " + egrepFilterRe(filterRe);
    }
    if (removeNewline) {
      cmd += " | " + trEliminateNewline;
    }
    return pexec.pexec(cmd).
      then(function(res) { return res.stdout; });
  };

  var ocrPdf = function(pdfFile, filterRe, removeNewline) {
    return prepPdfForOcr(pdfFile).
      then(function(preppedImageFile) {
        return ocrImage(preppedImageFile, filterRe, removeNewline);
      });
  };

  var pdfToImage = function(dirName, convertOptions, inFile, outFile) {
    var cmd = imgGenerate(dirName, convertOptions, inFile, outFile);
    return pexec.pexec(cmd).
      then(function() {
        return path.join(dirName, outFile);
      });
  };

  var mod = {
    splitDocument: splitDocument,
    createDocument: createDocument,
    rotateDocument: rotateDocument,
    pdfWords: pdfWords,
    prepPdfForOcr: prepPdfForOcr,
    ocrImage: ocrImage,
    ocrPdf: ocrPdf,
    pdfToImage: pdfToImage,
    identifyImageSize: identifyImageSize 
  };

  return mod;
}());
