import TokenIterator = require('../tokens/TokenIterator');
import Parser = require('../parser/Parser');
import Segment = require('../segments/ISegment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorExpressionSegment = require('../segments/RazorExpression');
import RazorStatementSegment = require('../segments/RazorStatement');
import RazorControlFlowStatement = require('../segments/RazorControlFlowStatement');

QUnit.module('Parser');

test('simple text', function(){
  var input = 'hello',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  equal(output.length, 1);
  ok(output[0] instanceof LiteralSegment, 'expected LiteralSegent');
  equal((<LiteralSegment>output[0]).value, 'hello');
});

test('simple html parse test', function () {
    var input = '<div></div>',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');
    var div = <HtmlSegment>output[0];
    equal(div.tagName, 'div');
    equal(div.children.length, 0);
    equal(div.isEmpty, false);
});

test('simple empty html element', function () {
    var input = '<div />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');
    var div = <HtmlSegment>output[0];
    equal(div.tagName, 'div');
    equal(div.children.length, 0);
    equal(div.isEmpty, true);
});

test('simple html parse test with attribute', function () {
    var input = '<div class="someclass"></div>',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');

    var div = <HtmlSegment>output[0];

    equal(div.tagName, 'div');
    equal(div.attributes.length, 1);

    var attribute = <HtmlAttributeSegment>div.attributes[0];

    equal(attribute.name, 'class');
    equal(attribute.values.length, 1);
    equal((<LiteralSegment>attribute.values[0]).value, 'someclass');
});

test('single html element with simple razor in attribute', function () {
    var input = '<div class="@model.something" />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    var attribute: HtmlAttributeSegment = (<HtmlSegment>output[0]).attributes[0];

    equal(attribute.values.length, 1);
    ok(attribute.values[0] instanceof RazorExpressionSegment, 'expected RazorExpressionSegment');

    var razor = <RazorExpressionSegment>attribute.values[0];

    equal(razor.expression, 'model.something');
});

test('single html element with razor array access in attribute', function () {
    var input = '<div class="@model.alpha[0].bravo" />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    var attribute: HtmlAttributeSegment = (<HtmlSegment>output[0]).attributes[0];

    equal(attribute.values.length, 1);
    ok(attribute.values[0] instanceof RazorExpressionSegment, 'expected RazorExpressionSegment');

    var razor = <RazorExpressionSegment>attribute.values[0];

    equal(razor.expression, 'model.alpha[0].bravo');
});

test('single html element with razor and literals in attribute', function () {
    var input = '<div class="alpha @model.something bravo" />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    var attribute: HtmlAttributeSegment = (<HtmlSegment>output[0]).attributes[0];

    equal(attribute.values.length, 3);
    ok(attribute.values[0] instanceof LiteralSegment, 'expected LiteralSegment');
    ok(attribute.values[1] instanceof RazorExpressionSegment, 'expected RazorExpressionSegment');
    ok(attribute.values[2] instanceof LiteralSegment, 'expected LiteralSegment');

    var alpha = <LiteralSegment>attribute.values[0];
    var razor = <RazorExpressionSegment>attribute.values[1];
    var bravo = <LiteralSegment>attribute.values[2];

    equal(alpha.value, 'alpha ');
    equal(razor.expression, 'model.something');
    equal(bravo.value, ' bravo');
});

test('single nested html element', function () {
    var input = '<div><p/></div>',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');

    var div = <HtmlSegment>output[0];
    equal(div.tagName, 'div');
    equal(div.children.length, 1);

    var p = <HtmlSegment>div.children[0];
    equal(p.tagName, 'p');
    equal(p.children.length, 0);
});

test('single html element with text content', function () {
    var input = '<div>Hello, world!</div>',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');

    var div = <HtmlSegment>output[0];
    equal(div.tagName, 'div');
    equal(div.children.length, 1);

    var text = <LiteralSegment>div.children[0];
    equal(text.value, 'Hello, world!');
});

test('single nested html element with text content', function () {
    var input = '<div>Hello, <span>world!</span></div>',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    equal(output.length, 1);
    ok(output[0] instanceof HtmlSegment, 'expected HtmlSegment');

    var div = <HtmlSegment>output[0];
    equal(div.tagName, 'div');
    equal(div.children.length, 2);

    var text1 = <LiteralSegment>div.children[0];
    equal(text1.value, 'Hello, ');

    var span = <HtmlSegment>div.children[1];
    equal(span.tagName, 'span');
    equal(span.children.length, 1);

    var text2 = <LiteralSegment>span.children[0];
    equal(text2.value, 'world!');
});

test('whitespace before closing bracket in empty html segment recorded', function(){
  var input = '<div   />',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var segment = <HtmlSegment>output[0];
  equal(segment.whitespaceBeforeClosing.length, 3);
});

test('whitespace before html attribute recorded', function(){
  var input = '<a  b="c"/>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var htmlSegment = <HtmlSegment>output[0];
  var attrSegment = htmlSegment.attributes[0];
  equal(attrSegment.whitespacePrefix, '  ');
});

test('whitespace before html tag recorded', function(){
  var input = '  <div/>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();
  var htmlSegment = <HtmlSegment>output[0];
  equal(htmlSegment.leadingWhitespace, '  ');
});

test('whitespace before closing html tag recorded', function(){
  var input = '<div>  </div>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();
  var htmlSegment = <HtmlSegment>output[0];
  equal(htmlSegment.whitespaceBeforeClosing, '  ');
});

test('empty razor block', function(){
  var input = '@{ }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  equal(output.length, 1);
  ok(output[0] instanceof RazorBlockSegment, 'expected RazorBlockSegment');

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 0);
});

test('razor block with single html element', function(){
  var input = '@{ <div /> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof HtmlSegment, 'expected HtmlSegment');
});

test('html inside razor block', function(){
  var input = '@if (true) { <div /> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorControlFlowStatement, 'expected RazorControlFlowStatement');
  var razorSegment = <RazorControlFlowStatement>output[0];
  equal(razorSegment.type, 'if');
  equal(razorSegment.expression.expression, 'true');
  equal(razorSegment.block.statements.length, 1);
  ok(razorSegment.block.statements[0] instanceof HtmlSegment, 'expected HtmlSegment inside block');
});

test('empty for loop razor expression', function(){
  var input = '@for(var i = 0; i < 2; ++i) { }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorControlFlowStatement, 'expected RazorControlFlowStatement');
  var statement = <RazorControlFlowStatement>output[0];
  equal(statement.type, 'for');
  equal(statement.expression.expression, 'var i = 0; i < 2; ++i');
});
