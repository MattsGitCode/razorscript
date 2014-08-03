/// <reference path="../typings/node.d.ts" />
import razor = require('../Razor');
import fs = require('fs');

QUnit.module('Feature tests');

var testFiles = fs.readdirSync('src/tests/testfiles');
var tests: Array<string> = [];
testFiles.forEach(file => {
  var match = /(.*)_razor.jshtml/.exec(file);
  if (match){
    tests.push(match[1]);
  }
});

tests.forEach(name => {
  var razorFilename = 'src/tests/testfiles/' + name + '_razor.jshtml',
      modelFilename = 'src/tests/testfiles/' + name + '_model.json',
      expectedFilename = 'src/tests/testfiles/' + name + '_expected.html';

  var razorInput = fs.readFileSync(razorFilename, {encoding: 'utf8'}),
      model = JSON.parse(fs.readFileSync(modelFilename, {encoding: 'utf8'})),
      expected = fs.readFileSync(expectedFilename, {encoding: 'utf8'});

  test('feature test ' + name, function() {
    var view = razor.transpile(razorInput);
    var instance = new view(model);
    var output = instance.execute();
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
  var view = razor.transpileFile('src/tests/testfiles/01_razor.jshtml'),
      instance = new view(model),
      expected = fs.readFileSync('src/tests/testfiles/01_expected.html', {encoding: 'utf8'});
  var output = instance.execute();

  equal(output, expected);
});
