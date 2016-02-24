import TokenIterator = require('../tokens/TokenIterator');
import Parser = require('../parser/Parser');
import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import HtmlCommentSegment = require('../segments/HtmlComment');
import HtmlDocTypeSegment = require('../segments/HtmlDocType');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorInlineExpression = require('../segments/RazorInlineExpression');

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
    ok(attribute.values[0] instanceof RazorInlineExpression, 'expected RazorInlineExpression');

    var prop = <RazorVariableAccess>(<RazorInlineExpression>attribute.values[0]).expression;
    equal(prop.name, 'something');
    ok(prop.object instanceof RazorVariableAccess);
    var obj = <RazorVariableAccess>prop.object;
    equal(obj.name, 'model');
    equal(obj.object, null);
});

test('single html element with razor array access in attribute', function () {
    var input = '<div class="@model.alpha[0].bravo" />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    var attribute: HtmlAttributeSegment = (<HtmlSegment>output[0]).attributes[0];

    equal(attribute.values.length, 1);
    ok(attribute.values[0] instanceof RazorInlineExpression, 'expected RazorInlineExpression');

    var bravo = <RazorVariableAccess>(<RazorInlineExpression>attribute.values[0]).expression;
    equal(bravo.name, 'bravo');
    ok(bravo.object instanceof RazorArrayAccess, 'expected RazorArrayAccess');

    var arrayAccess = <RazorArrayAccess>bravo.object;
    ok(arrayAccess.argument instanceof RazorLiteral, 'expected RazorLiteral');
    ok(arrayAccess.accessor instanceof RazorVariableAccess, 'expected RazorVariableAccess');

    var arg = <RazorLiteral>arrayAccess.argument;
    equal(arg.expression, '0');

    var array = <RazorVariableAccess>arrayAccess.accessor;
    equal(array.name, 'alpha');
    ok(array.object instanceof RazorVariableAccess, 'expected RazorVariableAccess');

    var model = <RazorVariableAccess>array.object;
    equal(model.name, 'model');
    equal(model.object, null);
});

test('single html element with razor and literals in attribute', function () {
    var input = '<div class="alpha @model.something bravo" />',
        it = new TokenIterator(input),
        parser = new Parser(it),
        output: Array<Segment>;

    output = parser.parse();

    var h = <HtmlSegment>output[0];
    var a = <HtmlAttributeSegment>h.attributes[0];
    var l1 = <LiteralSegment>a.values[0];
    var l2 = <LiteralSegment>a.values[2];
    var r1 = <RazorVariableAccess>(<RazorInlineExpression>a.values[1]).expression;
    var r2 = <RazorVariableAccess>r1.object;

    equal(l1.value, 'alpha ');
    equal(l2.value, ' bravo');
    equal(r1.name, 'something');
    equal(r2.name, 'model');
    equal(r2.object, null);
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

test('namespace in html attribute name', function() {
  var input = '<div a:b="c"/>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var div = <HtmlSegment>output[0];
  equal(div.attributes.length, 1);

  var attribute = <HtmlAttributeSegment>div.attributes[0];

  equal(attribute.name, 'a:b');
  equal(attribute.values.length, 1);
  equal((<LiteralSegment>attribute.values[0]).value, 'c');
});

test('hyphen in html attribute name', function() {
  var input = '<div a-b="c"/>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var div = <HtmlSegment>output[0];
  equal(div.attributes.length, 1);

  var attribute = <HtmlAttributeSegment>div.attributes[0];

  equal(attribute.name, 'a-b');
  equal(attribute.values.length, 1);
  equal((<LiteralSegment>attribute.values[0]).value, 'c');
});

test('doctype element', function() {
  var input = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var doctype = <HtmlDocTypeSegment>output[0];
  equal(doctype.name, ' html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"');
});

test('html comment', function() {
  var input = '<!--some comment here-->',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var comment = <HtmlCommentSegment>output[0];
  equal(comment.text, 'some comment here');
});

test('script block', function() {
  var input = "\
      <script type='text/javascript'>\
          var codeTags = document.getElementsByTagName('code'),\
              i, pre;\
          for (var i = 0; i < codeTags.length; ++i) {\
              var code = codeTags[i],\
                  pre = code.parentNode;\
              if (pre.nodeName.toLowerCase() === 'pre') {\
                  pre.className = 'prettyprint linenums:1';\
              } else {\
                  code.className = 'prettyprint';\
              }\
          }\
        \
          prettyPrint();\
      </script>",
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var script = <HtmlSegment>output[0];
  equal('', '');
});

test('urls in attributes parsed without added whitespace', function() {
  var input = '<a href="http://mattscode.com/razorscript/">test</a>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;
  
  output = parser.parse();

  var a = <HtmlSegment>output[0];
  var href = a.attributes[0];

  equal(href.values.length, 1);

  var val = <LiteralSegment>href.values[0];
  equal(val.value, 'http://mattscode.com/razorscript/');
});
