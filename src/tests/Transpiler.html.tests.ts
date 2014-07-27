import ISegment = require('../segments/ISegment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorExpressionSegment = require('../segments/RazorExpression');
import RazorStatementSegment = require('../segments/RazorStatement');
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler HTML');

var transpile = function(...segments: Array<ISegment>): IView {
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass();

  return viewInstance;
};

test('single non-empty tag with no attributes', function () {
  var view = transpile(new HtmlSegment('div')),
      result = view.execute();

  equal(result, "<div></div>");
});

test('single empty tag with no attributes', function() {
  var view = transpile(new HtmlSegment('div', true, '')),
      result = view.execute();

  equal(result, '<div/>');
});

test('single non-empty tag with single attribute', function () {
    var view = transpile(new HtmlSegment('div', [new HtmlAttributeSegment('class', '\'', ' ', [new LiteralSegment('my-style')])])),
        result = view.execute();

    equal(result, '<div class=\'my-style\'></div>');
});

test('single empty tag with single attribute', function() {
    var view = transpile(new HtmlSegment('div', true, '', [new HtmlAttributeSegment('class', '"', ' ', [new LiteralSegment('my-style')])])),
      result = view.execute();

  equal(result, '<div class="my-style"/>');
});

test('empty attribute removed from tag', function() {
  var view = transpile(
        new HtmlSegment('div', true, '', [
          new HtmlAttributeSegment('class', '\'', ' ', [
            new RazorExpressionSegment('null')
          ])
        ])
      ),
      result = view.execute();

  equal(result, '<div/>');
});
/*
test('single empty tag inside for loop', function() {
  var view = transpile('@for(int i = 0; i < 2; ++i) { <div/> }'),
      result = view.execute();

  equal(result, '<div/><div/><div/>');
});
*/
test('whitespace preserved inside empty tag', function() {
  var view = transpile(
        new HtmlSegment('div', true, ''),
        new HtmlSegment('div', true, ' ')
      ),
      result = view.execute();

  equal(result, '<div/><div />');
});

test('whitespace preserved before attribute', function() {
  var view = transpile(//'<div     class="my-class" />'),
        new HtmlSegment('div', true, ' ', [
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
        new HtmlSegment('div', true, ' ', [
          new HtmlAttributeSegment('class', '"', '      ', [
            new RazorExpressionSegment('null')
          ])
        ])
      ),
      result = view.execute();

  equal(result, '<div />');
});
