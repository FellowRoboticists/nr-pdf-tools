'use strict'

module.exports = (function () {
  const pexec = require('@naiveroboticist/pexec')
  const compile = require('string-template/compile')
  const path = require('path')

  const quoteString = compile('"{0}"')
  const pdftkBurstTemplate = compile('pdftk {0} burst output {1}')
  const pdftkCreateTemplate = compile('(cd {0}; pdftk {1} cat output {2})')
  const pdftkRotateTemplate = compile('(cd {0}; pdftk {1} cat 1-end{2} output {3})')
  const imgGenerate = compile('(cd {0}; convert {1} {2}[0] {3})')
  const pdftotextExtract = compile('pdftotext {0} -')
  const egrepFilterRe = compile("egrep -o '{0}'")
  const trEliminateNewline = "tr '\\n' ' '"
  const tesseractImage = compile('tesseract {0} stdout')
  const gsOcrPrep = compile('gs -dSAFER -sDEVICE=png16m -dINTERPOLATE -dNumRenderingThreads=2 -dFirstPage=1 -dLastPage=1 -r300 -o {1} -c 30000000 setvmthreshold -f {0}')
  const identifySize = compile("identify {0} | cut -d ' ' -f 3")
  const createWatermark = compile("convert -size {0}x{1} xc:transparent -font Helvetica-bold -pointsize 25 -fill \"graya(65%,0.5)\" -draw \"translate {2},{3} rotate -45 text 0,0 '{9}'\" -draw \"translate {4},{5} rotate -45 text 0,0 '{9}'\" -draw \"translate {6},{7} rotate -45 text 0,0 '{9}'\" {8}")
  const watermarkToPdf = compile('convert {0} {1}')
  const stampPdf = compile('pdftk {0} stamp {1} output {2}')
  const pdfimagesTemplate = compile('pdfimages -j -p {0} {1}')
  const tesseractToPdfTemplate = compile('tesseract {0} {1} pdf')

  const textAngleWidth = 177

  /**
   * Uses ImageMagick's identify to determine width/height of an image.
   *
   * imageFullPath - the fully qualified path to the image.
   *
   * returns object containing the width/height of the image.
   *
   * { width: <width>, height: <height> }
   */
  const identifyImageSize = (imageFullPath) => {
    let cmd = identifySize(quoteString(imageFullPath))
    return pexec.pexec(cmd)
      .then((res) => {
        let vals = res.stdout.split('x')
        return { width: parseInt(vals[0]), height: parseInt(vals[1]) }
      })
  }

  const tesseractToPdf = (imagePath) => {
    let baseName = path.basename(imagePath, '.jpg')
    let dirName = path.dirname(imagePath)
    let cmd = tesseractToPdfTemplate(imagePath,
                                     path.join(dirName, baseName))

    return pexec.pexec(cmd)
      .then((res) => path.join(path.dirname(imagePath), baseName + '.pdf'))
  }

  const pdfImages = (docToSplit, imagePath) => {
    let cmd = pdfimagesTemplate(quoteString(docToSplit),
                                path.join(imagePath, 'page'))
    return pexec.pexec(cmd)
      .then((res) => imagePath)
  }

  /**
   * Uses pdftk to split a PDF document into its component pages.
   *
   * docToSplit - full path to the PDF file to split.
   * pageDir - full path to the directory in which to place the page PDFs.
   */
  const splitDocument = (docToSplit, pageDir) => {
    let cmd = pdftkBurstTemplate(quoteString(docToSplit),
                                 path.join(pageDir, 'page_%04d.pdf'))
    return pexec.pexec(cmd)
      .then((res) => pageDir)
  }

  /**
   * Uses pdftk to create a new PDF document by concatenating the
   * specified input PDF documents.
   *
   * dirName - full path to the directory in which the docs to be concatenated are located
   * inFiles - array of file names to be merged into the new document
   * outFile - the full path to the location of the document to be created
   */
  const createDocument = (dirName, inFiles, outFile) => {
    let cmd = pdftkCreateTemplate(dirName,
                                  inFiles.map(function (f) { return quoteString(f) }).join(' '),
                                  outFile)
    return pexec.pexec(cmd)
      .then((res) => outFile)
  }

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
  const rotateDocument = (dirName, inFile, outFile, direction) => {
    let cmd = pdftkRotateTemplate(dirName,
                                  inFile,
                                  direction,
                                  outFile)
    return pexec.pexec(cmd)
  }

  const pdfWords = (pdfFile, filterRe, removeNewline) => {
    let cmd = pdftotextExtract(pdfFile)
    if (filterRe) {
      cmd += ' | ' + egrepFilterRe(filterRe)
    }
    if (removeNewline) {
      cmd += ' | ' + trEliminateNewline
    }
    return pexec.pexec(cmd)
      .then((res) => res.stdout)
  }

  const prepPdfForOcr = (pdfPath, imgPath) => {
    if (typeof imgPath === 'undefined') {
      // No image path was specified, need to create one using the
      // same path as the PDF.
      imgPath = path.join(path.dirname(pdfPath), path.basename(pdfPath) + '.png')
    }
    let cmd = gsOcrPrep(pdfPath, imgPath)
    return pexec.pexec(cmd)
      .then(() => imgPath)
  }

  const ocrImage = (imgFile, filterRe, removeNewline) => {
    let cmd = tesseractImage(imgFile)
    if (filterRe) {
      cmd += ' | ' + egrepFilterRe(filterRe)
    }
    if (removeNewline) {
      cmd += ' | ' + trEliminateNewline
    }
    return pexec.pexec(cmd)
      .then((res) => res.stdout)
  }

  const ocrPdf = (pdfFile, filterRe, removeNewline) => {
    return prepPdfForOcr(pdfFile)
      .then((preppedImageFile) => {
        return ocrImage(preppedImageFile, filterRe, removeNewline)
      })
  }

  const pdfToImage = (dirName, convertOptions, inFile, outFile) => {
    let cmd = imgGenerate(dirName, convertOptions, inFile, outFile)
    return pexec.pexec(cmd)
      .then(() => path.join(dirName, outFile))
  }

  const createAWatermark = (dimensions, watermarkFile, watermarkText) => {
    let cmd = createWatermark(dimensions.imageSize.width,
                              dimensions.imageSize.height,
                              dimensions.upperLeft.x,
                              dimensions.upperLeft.y,
                              dimensions.center.x,
                              dimensions.center.y,
                              dimensions.lowerRight.x,
                              dimensions.lowerRight.y,
                              watermarkFile,
                              watermarkText)
    return pexec.pexec(cmd)
      .then(() => watermarkFile)
  }

  const convertWatermarkToPdf = (watermarkPath, watermarkPdfPath) => {
    let cmd = watermarkToPdf(watermarkPath, watermarkPdfPath)
    return pexec.pexec(cmd)
      .then(() => watermarkPdfPath)
  }

  const stampPdfWithWatermark = (pdfToWatermark, watermarkPdf, resultingPdf) => {
    let cmd = stampPdf(pdfToWatermark, watermarkPdf, resultingPdf)
    return pexec.pexec(cmd)
      .then(() => resultingPdf)
  }

  const watermarkPdf = (pdfToWatermark, watermarkText) => {
    let watermarkFile = path.join(path.dirname(pdfToWatermark), 'watermark.png')
    let watermarkPdfPath = path.join(path.dirname(pdfToWatermark), 'watermark.pdf')
    let resultingPdf = path.join(path.dirname(pdfToWatermark), 'watermarked.pdf')
    return identifyImageSize(pdfToWatermark)
      .then((imageSize) => {
        return {
          imageSize: imageSize,
          upperLeft: {
            x: 20,
            y: textAngleWidth + 20
          },
          center: {
            x: Math.round((imageSize.width - textAngleWidth) / 2),
            y: Math.round(imageSize.height / 2 + textAngleWidth)
          },
          lowerRight: {
            x: imageSize.width - (textAngleWidth + 20),
            y: imageSize.height - 20
          }
        }
      })
      .then((dimensions) => {
        return createAWatermark(dimensions, watermarkFile, watermarkText)
      })
      .then((watermarkPath) => {
        return convertWatermarkToPdf(watermarkPath, watermarkPdfPath)
      })
      .then((watermarkPdf) => {
        return stampPdfWithWatermark(pdfToWatermark, watermarkPdf, resultingPdf)
      })
  }

  var mod = {
    splitDocument: splitDocument,
    createDocument: createDocument,
    rotateDocument: rotateDocument,
    pdfWords: pdfWords,
    prepPdfForOcr: prepPdfForOcr,
    ocrImage: ocrImage,
    ocrPdf: ocrPdf,
    pdfToImage: pdfToImage,
    identifyImageSize: identifyImageSize,
    watermarkPdf: watermarkPdf,
    pdfImages: pdfImages,
    tesseractToPdf: tesseractToPdf
  }

  return mod
}())
