var expect = require('chai').expect;
var tmp = require('tmp');
var path = require('path');
var fse = require('fs-extra');
var tools = require('../lib/index.js');

var pdfFile = "InnocuousDocument.pdf";
var lpdfFile = "LInnocuousDocument.pdf";
var pdfDir = "test-data";
var pdfDoc = path.join(pdfDir, pdfFile);
var lpdfDoc = path.join(pdfDir, lpdfFile);
var pngDoc = path.join(pdfDir, "InnocuousDocument.png");

describe('pdf-tools', function() {

  describe('#splitDocument', function() {
    
    it('returns the page where the pages have been split to', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        tools.splitDocument(pdfDoc, tmpPath).
          then(function(pageDir) {
            tmpCb();
            expect(pageDir).to.eq(tmpPath);
            done();
          }).
          catch(function(err) {
            tmpCb();
            done(err);
          });
      });
    });

    it('generates an error when the file to split doesnt exist', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { done(err); }
        tools.splitDocument("/tmp/not_there.pdf", tmpPath).
          then(function(pageDir) {
            tmpCb();
            done("Should have been an error");
          }).
          catch(function(err) {
            tmpCb();
            done();
          });
      });
    });
  });

  describe('#separateDocument', function() {
    
    it('returns the page where the pages have been split to', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        tools.separateDocument(pdfDoc, tmpPath).
          then(function(pageDir) {
            tmpCb();
            expect(pageDir).to.eq(tmpPath);
            done();
          }).
          catch(function(err) {
            tmpCb();
            done(err);
          });
      });
    });

    it('generates an error when the file to split doesnt exist', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { done(err); }
        tools.separateDocument("/tmp/not_there.pdf", tmpPath).
          then(function(pageDir) {
            tmpCb();
            done("Should have been an error");
          }).
          catch(function(err) {
            tmpCb();
            done();
          });
      });
    });
  });


  describe('#createDocument', function() {

    it('creates a new document out of a couple of documents', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { done(err); }
        var newFilePath = path.join(tmpPath, "newfile.pdf");
        tools.createDocument(pdfDir, [ pdfFile, pdfFile ], newFilePath).
          then(function(filePath) {
            tmpCb();
            expect(filePath).to.equal(newFilePath);
            done();
          }).
          catch(function(err) {
            tempCb();
            done(err);
          });
      });
    });
  });

  describe('#rotateDocument', function() {

    it('rotates a document CC 90', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToRotate = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToRotate, function(err) {
          if (err) { return done(err); }
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'east').
            then(function() {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tempCb();
              done(err);
            });
        });
      });
    });

    it('rotates a document CCW 90', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToRotate = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToRotate, function(err) {
          if (err) { return done(err); }
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'west').
            then(function() {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tempCb();
              done(err);
            });
        });
      });
    });

    it('rotates a document 180', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToRotate = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToRotate, function(err) {
          if (err) { return done(err); }
          tools.rotateDocument(tmpPath, pdfFile, 'rotatedFile.pdf', 'south').
            then(function() {
              fse.access(path.join(tmpPath, 'rotatedFile.pdf'), fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tempCb();
              done(err);
            });
        });
      });
    });

  });

  describe('#pdfWords', function() {

    it('returns the text from the PDF with no filtering and with newlines', function(done) {
      tools.pdfWords(pdfDoc).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });

    it('returns the text from the PDF with filtering and with no newlines', function(done) {
      var textFilterRegex = '[^ ",]{3,}';
      tools.pdfWords(pdfDoc, textFilterRegex).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });

    it('returns the text from the PDF with filtering and no newlines', function(done) {
      var textFilterRegex = '[^ ",]{3,}';
      tools.pdfWords(pdfDoc, textFilterRegex, true).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });
  });

  describe('#ocrImage', function() {

    it("returns the text from the image with no filtering and with newlines", function(done) {
      this.timeout(40000);
      tools.ocrImage(pngDoc).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });

    it("returns the text from the image with filtering and with newlines", function(done) {
      this.timeout(40000);
      var textFilterRegex = '[^ ",]{3,}';
      tools.ocrImage(pngDoc, textFilterRegex).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });

    it("returns the text from the image with filtering and with no newlines", function(done) {
      this.timeout(40000);
      var textFilterRegex = '[^ ",]{3,}';
      tools.ocrImage(pngDoc, textFilterRegex, true).
        then(function(text) {
          expect(text.length).to.not.equal(0);
          done();
        }).
        catch(done);
    });
  });

  describe('#prepPdfForOcr', function() {

    it('will create an image of the PDF suitable for using for OCR', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToPrep = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToPrep, function(err) {
          if (err) { return done(err); }
          var ocrImage = path.join(tmpPath, 'preppedImage.png');
          tools.prepPdfForOcr(fileToPrep, ocrImage).
            then(function(preppedImage) {
              expect(preppedImage).to.equal(ocrImage);
              fse.access(ocrImage, fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tmpCb();
              done(err);
            });
        });
      });
    });

    it('will create an image of the PDF suitable for using for OCR with its own name', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToPrep = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToPrep, function(err) {
          if (err) { return done(err); }
          tools.prepPdfForOcr(fileToPrep).
            then(function(preppedImage) {
              expect(preppedImage).to.equal(fileToPrep + ".png");
              fse.access(fileToPrep + ".png", fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tmpCb();
              done(err);
            });
        });
      });
    });

  });

  describe('#ocrPdf', function() {

    it("will OCR and extract the text from the specified PDF file no filter and with newlines", function(done) {
      this.timeout(40000);
      var textFilterRegex = '[^ ",]{3,}';
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToOcr = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToOcr, function(err) {
          if (err) { return done(err); }
          tools.ocrPdf(fileToOcr, textFilterRegex, true).
            then(function(text) {
              tmpCb();
              expect(text.length).to.not.equal(0);
              done();
            }).
            catch(function(err) {
              tmpCb();
              done(err);
            });
        })
      });
    });
  });

  describe('#pdfToImage', function() {

    it('will create an image from the PDF', function(done) {
      tmp.dir({ unsafeCleanup: true }, function(err, tmpPath, tmpCb) {
        if (err) { return done(err); }
        var fileToProcess = path.join(tmpPath, pdfFile);
        fse.copy(pdfDoc, fileToProcess, function(err) {
          if (err) { return done(err); }
          tools.pdfToImage(tmpPath, "-depth 4 -type Grayscale", pdfFile, pdfFile + ".png").
            then(function(imagePath) {
              expect(imagePath).to.equal(fileToProcess + ".png");
              fse.access(fileToProcess + ".png", fse.F_OK, function(err) {
                tmpCb();
                done(err);
              });
            }).
            catch(function(err) {
              tmpCb();
              done(err);
            });
        });
      });
    });
  });

  describe('#identifyImageSize', function() {

    it('returns the width and height of the image', function(done) {
      tools.identifyImageSize(pngDoc).
        then(function(imgSize) {
          expect(imgSize.height).to.eq(792);
          expect(imgSize.width).to.eq(612);
          done();
        }).
        catch(done);
    });
  });

  describe('#watermarkPdf', function() {
    it('correctly watermarks a portrait PDF', function(done) {
      tools.watermarkPdf(pdfDoc, 'TIG BORN AMIGING').
        then(function() { done(); }).
        catch(done);
    });
  });

});
