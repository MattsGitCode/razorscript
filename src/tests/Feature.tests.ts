/// <reference path="../typings/node.d.ts" />
import razor = require('../Razor');
import fs = require('fs');

QUnit.module('Feature tests');

var tests = fs.readdirSync('src/tests/testfiles');

tests.forEach(name => {
  var razorFilename = 'src/tests/testfiles/' + name + '/razor.jshtml',
      modelFilename = 'src/tests/testfiles/' + name + '/model.json',
      expectedFilename = 'src/tests/testfiles/' + name + '/expected.html';

  var modelFileContents: string;
  
  try {
    modelFileContents = fs.readFileSync(modelFilename, {encoding: 'utf8'});
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
  }

  var model = modelFileContents ? JSON.parse(modelFileContents) : null,
      expected = fs.readFileSync(expectedFilename, {encoding: 'utf8'});


  test('feature test ' + name.replace(/_/g, ' '), function() {
    var viewEngine = new razor.ViewEngine(),
        output = viewEngine.renderView(razorFilename, model, null);

    expected = expected.replace(/>[ \n\r]*</g, '><');
    output = output.replace(/>[ \n\r]*</g, '><');

    equal(output, expected);
  });
});


test('transpile file', function(){
  var model = {
    title: 'Hobbits',
    current: 'Frodo',
    items: [
      'Bilbo',
      'Fredegar',
      'Frodo',
      'Meriadoc',
      'Peregrin',
      'Samwise',
    ]
  };
  var view = razor.transpileFile('src/tests/testfiles/for_loop_and_partials/razor.jshtml'),
      instance = new view(model),
      expected = fs.readFileSync('src/tests/testfiles/for_loop_and_partials/expected.html', {encoding: 'utf8'});
  var output = instance.execute();

  equal(output, expected);
});
