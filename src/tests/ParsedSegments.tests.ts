import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');

QUnit.module('ParsedSegments');

test('create implicit non-empty html segment', function () {
  var seg = new HtmlSegment('div');

  equal(seg.tagName, "div");
  equal(seg.isEmpty, false);
  equal(seg.attributes.length, 0);
  equal(seg.children.length, 0);
});

test('create explicit empty html segment', function () {
  var seg = new HtmlSegment('div', true, '');

  equal(seg.isEmpty, true);
  equal(seg.attributes.length, 0);
  equal(seg.children.length, 0);
});

test('create explicit non-empty html segment', function () {
  var seg = new HtmlSegment('div', false, '');

  equal(seg.isEmpty, false);
  equal(seg.attributes.length, 0);
  equal(seg.children.length, 0);
});

test('create explicit empty html segment with attributes', function(){
  var seg = new HtmlSegment('div', true, ' ', [ new HtmlAttributeSegment('class', '\'', ' ', [])]);

  equal(seg.isEmpty, true);
  equal(seg.whitespaceBeforeClosing, ' ');
  equal(seg.attributes.length, 1);
  equal(seg.children.length, 0);
});

test('create implicit non-empty html segment with attributes and children', function () {
  var seg = new HtmlSegment('div', [ new HtmlAttributeSegment('class', '\'', ' ', [])], [ new HtmlSegment('span', true, '')]);

  equal(seg.tagName, "div");
  equal(seg.isEmpty, false);
  equal(seg.attributes.length, 1);
  equal(seg.children.length, 1);
});
