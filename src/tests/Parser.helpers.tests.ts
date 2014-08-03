import TokenIterator = require('../tokens/TokenIterator');
import Parser = require('../parser/Parser');
import Segment = require('../segments/Segment');
import RazorHelper = require('../segments/RazorHelper');
import HtmlSegment = require('../segments/Html');

QUnit.module('Parser');

test('empty helper with no parameters', function() {
  var input = '@helper bbq(){}',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorHelper);
  var helper = <RazorHelper>output[0];
  equal(helper.name, 'bbq');
  equal(helper.parameters.length, 0);
  equal(helper.block.statements.length, 0);
});

test('empty helper with single parameter', function() {
  var input = '@helper bbq(coal){}',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorHelper);
  var helper = <RazorHelper>output[0];
  equal(helper.name, 'bbq');
  equal(helper.parameters.length, 1);
  equal(helper.parameters[0], 'coal');
  equal(helper.block.statements.length, 0);
});

test('empty helper with two parameters', function() {
  var input = '@helper bbq(coal, burgers){}',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorHelper);
  var helper = <RazorHelper>output[0];
  equal(helper.name, 'bbq');
  equal(helper.parameters[0], 'coal');
  equal(helper.parameters[1], 'burgers');
  equal(helper.block.statements.length, 0);
});

test('non-empty helper with no parameters', function() {
  var input = '@helper bbq(){ <div/> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorHelper);
  var helper = <RazorHelper>output[0];
  equal(helper.name, 'bbq');
  equal(helper.parameters.length, 0);
  equal(helper.block.statements.length, 1);
  ok(helper.block.statements[0] instanceof HtmlSegment);
});
