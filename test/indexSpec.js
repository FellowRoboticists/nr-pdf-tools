'use strict'

const expect = require('chai').expect
const tmp = require('tmp')
const path = require('path')
const fse = require('fs-extra')
const tools = require('../lib/index.js')

const pdfFile = 'InnocuousDocument.pdf'
const pdfDir = 'test-data'
const pdfDoc = path.join(pdfDir, pdfFile)
const pngDoc = path.join(pdfDir, 'InnocuousDocument.png')
const pdfWordsNoOptions = path.join(pdfDir, 'InnocuousDocument.txt')
const pdfWordsJustGrep = path.join(pdfDir, 'InnocuousDocumentGrep.txt')
const pdfWordsGrepNoNewline = path.join(pdfDir, 'InnocuousDocumentGrepNoNewline.txt')
const pdfWordsNoNewlinePage1 = path.join(pdfDir, 'InnocuousDocumentNoNewlinePage1.txt')

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fse.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

describe('pdf-tools', function () {
  describe('#splitDocument', function () {
    xit('returns the page where the pages have been split to', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        tools.splitDocument(pdfDoc, tmpPath)
          .then(function (pageDir) {
            tmpCb()
            expect(pageDir).to.eq(tmpPath)
            done()
          })
          .catch(function (err) {
            tmpCb()
            done(err)
          })
      })
    })

    xit('generates an error when the file to split doesnt exist', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        tools.splitDocument('/tmp/not_there.pdf', tmpPath)
          .then(function (pageDir) {
            tmpCb()
            done('Should have been an error')
          })
          .catch(function () {
            tmpCb()
            done()
          })
      })
    })
  })

  describe('#separateDocument', function() {
    it('returns the page where the pages have been split to', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err) }
        tools.separateDocument(pdfDoc, tmpPath)
          .then(function(pageDir) {
            tmpCb()
            expect(pageDir).to.eq(tmpPath)
            done()
          })
          .catch(function(err) {
            tmpCb()
            done(err)
          })
      })
    })

    it('generates an error when the file to split doesnt exist', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { done(err) }
        tools.separateDocument("/tmp/not_there.pdf", tmpPath)
          .then(function(pageDir) {
            tmpCb()
            done("Should have been an error")
          })
          .catch(function(err) {
            tmpCb()
            done()
          })
      })
    })
  })

  describe('#createDocument', function () {
    xit('creates a new document out of a couple of documents', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) done(err)
        let newFilePath = path.join(tmpPath, 'newfile.pdf')
        tools.createDocument(pdfDir, [ pdfFile, pdfFile ], newFilePath)
          .then(function (filePath) {
            tmpCb()
            expect(filePath).to.equal(newFilePath)
            done()
          })
          .catch(function (err) {
            tmpCb()
            done(err)
          })
      })
    })
  })

  describe('#rotateDocument', function () {
    xit('rotates a document CC 90', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        var fileToRotate = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToRotate, function (err) {
          if (err) return done(err)
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'east')
            .then(function () {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })

    xit('rotates a document CCW 90', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToRotate = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToRotate, function (err) {
          if (err) return done(err)
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'west')
            .then(function () {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })

    xit('rotates a document 180', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToRotate = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToRotate, function (err) {
          if (err) return done(err)
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'south')
            .then(function () {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })
  })

  describe('#pdfWords', function () {
    it('returns the text from the PDF with no filtering and with newlines', function (done) {
      readFile(pdfWordsNoOptions)
        .then((expectedText) => {
          tools.pdfWords(pdfDoc)
            .then(function (text) {
              expect(text.length).to.not.equal(0)
              expect(text).to.equal(expectedText)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('returns the text from the PDF with filtering and with no newlines', function (done) {
      let textFilterRegex = '[^ ",]{3,}'
      readFile(pdfWordsJustGrep)
        .then((expectedText) => {
          tools.pdfWords(pdfDoc, textFilterRegex)
            .then(function (text) {
              expect(text.length).to.not.equal(0)
              expect(text).to.equal(expectedText)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('returns the text from the PDF with filtering and no newlines', function (done) {
      let textFilterRegex = '[^ ",]{3,}'
      readFile(pdfWordsGrepNoNewline)
        .then((expectedText) => {
          tools.pdfWords(pdfDoc, textFilterRegex, true)
            .then(function (text) {
              expect(text.length).to.not.equal(0)
              expect(text).to.equal(expectedText)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })

    it('will extract the text of only the first page of a PDF', function (done) {
      readFile(pdfWordsNoNewlinePage1)
        .then((expectedText) => {
          tools.pdfWords(pdfDoc, null, true, 1, 1)
            .then(function (text) {
              expect(text.length).to.not.equal(0)
              expect(text).to.equal(expectedText)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })

  describe('#ocrImage', function () {
    it('returns the text from the image with no filtering and with newlines', function (done) {
      this.timeout(40000)
      tools.ocrImage(pngDoc)
        .then(function (text) {
          expect(text.length).to.not.equal(0)
          done()
        })
        .catch(done)
    })

    it('returns the text from the image with filtering and with newlines', function (done) {
      this.timeout(40000)
      let textFilterRegex = '[^ ",]{3,}'
      tools.ocrImage(pngDoc, textFilterRegex)
        .then(function (text) {
          expect(text.length).to.not.equal(0)
          done()
        })
        .catch(done)
    })

    it('returns the text from the image with filtering and with no newlines', function (done) {
      this.timeout(40000)
      let textFilterRegex = '[^ ",]{3,}'
      tools.ocrImage(pngDoc, textFilterRegex, true)
        .then(function (text) {
          expect(text.length).to.not.equal(0)
          done()
        })
        .catch(done)
    })
  })

  describe('#prepPdfForOcr', function () {
    it('will create an image of the PDF suitable for using for OCR', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToPrep = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToPrep, function (err) {
          if (err) return done(err)
          let ocrImage = path.join(tmpPath, 'preppedImage.png')
          tools.prepPdfForOcr(fileToPrep, ocrImage)
            .then(function (preppedImage) {
              expect(preppedImage).to.equal(ocrImage)
              fse.access(ocrImage, fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })

    it('will create an image of the PDF suitable for using for OCR with its own name', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToPrep = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToPrep, function (err) {
          if (err) return done(err)
          tools.prepPdfForOcr(fileToPrep)
            .then(function (preppedImage) {
              expect(preppedImage).to.equal(fileToPrep + '.png')
              fse.access(fileToPrep + '.png', fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })
  })

  describe('#ocrPdf', function () {
    it('will OCR and extract the text from the specified PDF file no filter and with newlines', function (done) {
      this.timeout(40000)
      let textFilterRegex = '[^ ",]{3,}'
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToOcr = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToOcr, function (err) {
          if (err) return done(err)
          tools.ocrPdf(fileToOcr, textFilterRegex, true)
            .then(function (text) {
              tmpCb()
              expect(text.length).to.not.equal(0)
              done()
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })
  })

  describe('#pdfToImage', function () {
    it('will create an image from the PDF', function (done) {
      tmp.dir({ unsafeCleanup: true }, function (err, tmpPath, tmpCb) {
        if (err) return done(err)
        let fileToProcess = path.join(tmpPath, pdfFile)
        fse.copy(pdfDoc, fileToProcess, function (err) {
          if (err) return done(err)
          tools.pdfToImage(tmpPath, '-depth 4 -type Grayscale', pdfFile, pdfFile + '.png')
            .then(function (imagePath) {
              expect(imagePath).to.equal(fileToProcess + '.png')
              fse.access(fileToProcess + '.png', fse.F_OK, function (err) {
                tmpCb()
                done(err)
              })
            })
            .catch(function (err) {
              tmpCb()
              done(err)
            })
        })
      })
    })
  })

  describe('#identifyImageSize', function () {
    it('returns the width and height of the image', function (done) {
      tools.identifyImageSize(pngDoc)
        .then(function (imgSize) {
          expect(imgSize.height).to.eq(792)
          expect(imgSize.width).to.eq(612)
          done()
        })
        .catch(done)
    })
  })

  describe('#watermarkPdf', function () {
    xit('correctly watermarks a portrait PDF', function (done) {
      tools.watermarkPdf(pdfDoc, 'TIG BORN AMIGING')
        .then(function () { done() })
        .catch(done)
    })
  })
})
