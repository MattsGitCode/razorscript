import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import HtmlCommentSegment = require('../segments/HtmlComment');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorStatementSegment = require('../segments/RazorStatement');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorInlineExpression = require('../segments/RazorInlineExpression');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler HTML');

var transpile = function(...segments: Array<Segment>): IView {
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass();

  return viewInstance;
};

test('single non-empty tag with no attributes', function () {
  var view = transpile(new HtmlSegment('div', '', '')),
      result = view.execute();

  equal(result, "<div></div>");
});

test('single empty tag with no attributes', function() {
  var view = transpile(new HtmlSegment('div', '', '', true)),
      result = view.execute();

  equal(result, '<div/>');
});

test('single non-empty tag with single attribute', function () {
    var view = transpile(new HtmlSegment('div', '', '', [new HtmlAttributeSegment('class', '\'', ' ', [new LiteralSegment('my-style')])])),
        result = view.execute();

    equal(result, '<div class=\'my-style\'></div>');
});

test('single empty tag with single attribute', function() {
    var view = transpile(new HtmlSegment('div', '', '', true, [new HtmlAttributeSegment('class', '"', ' ', [new LiteralSegment('my-style')])])),
      result = view.execute();

  equal(result, '<div class="my-style"/>');
});

test('empty attribute removed from tag', function() {
  var view = transpile(
        new HtmlSegment('div', '', '', true, [
          new HtmlAttributeSegment('class', '\'', ' ', [
            new RazorInlineExpression(
              new RazorLiteral('null')
            )
          ])
        ])
      ),
      result = view.execute();

  equal(result, '<div/>');
})

test('whitespace preserved inside empty tag', function() {
  var view = transpile(
        new HtmlSegment('div', '', '', true),
        new HtmlSegment('div', '', ' ', true)
      ),
      result = view.execute();

  equal(result, '<div/><div />');
});

test('whitespace preserved before closing tag', function() {
  var view = transpile(
        new HtmlSegment('div', '', '  ')
      ),
      result = view.execute();

  equal(result, '<div>  </div>');
});

test('whitespace preserved before attribute', function() {
  var view = transpile(//'<div     class="my-class" />'),
        new HtmlSegment('div', '', ' ', true, [
          new HtmlAttributeSegment('class', '"', '     ', [
            new LiteralSegment('my-class')
          ])
        ])
      ),
      result = view.execute();

  equal(result, '<div     class="my-class" />');
});

test('whitespace prefixing attribute removed if attribute is removed', function() {
  var view = transpile(//'<div     class="@(null)" />'),
        new HtmlSegment('div', '', ' ', true, [
          new HtmlAttributeSegment('class', '"', '      ', [
            new RazorInlineExpression(
              new RazorLiteral('null')
            )
          ])
        ])
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('leading whitespace preserved in output of html', function(){
  var view = transpile(
        new HtmlSegment('div', '    ', '', true)
      ),
      result = view.execute();
  equal(result, '    <div/>')
});

test('newlines in whitespace preserved', function() {
  var view = transpile(
        new HtmlSegment('div', ' \n ', '', true)
      ),
      result = view.execute();
  equal(result, ' \n <div/>')
});

test('html comments preserved', function() {
  var view = transpile(
        new HtmlCommentSegment('  ', 'my comment')
      ),
      result = view.execute();
  equal(result, '  <!--my comment-->');
});

test('whitespace preserved between razor simple expressions inside html', function() {
  var view = transpile(
        new HtmlSegment('a', '', '', [], [
          new RazorInlineExpression(
            new RazorVariableAccess('model')
          ),
          new RazorInlineExpression(
            new RazorVariableAccess('model'),
            ' '
          )
        ])
      );

  view.model = 'b';
  var result = view.execute();

  equal(result, '<a>b b</a>');
});

