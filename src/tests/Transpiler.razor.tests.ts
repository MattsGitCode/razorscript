import ISegment = require('../segments/ISegment');
import Html = require('../segments/Html');
import HtmlAttribute = require('../segments/HtmlAttribute');
import Literal = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorExpression = require('../segments/RazorExpression');
import RazorStatement = require('../segments/RazorStatement');
import RazorControlFlowStatement = require('../segments/RazorControlFlowStatement')
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler Razor');

var transpile = function(...segments: Array<ISegment>): IView {
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass();

  return viewInstance;
};

test('razor expression with literal string', function() {
  var view = transpile(// @("hello")
        new RazorExpression('"hello"')
      ),
      result = view.execute();

  equal(result, 'hello');
});

test('razor expression with literal number', function() {
  var view = transpile(// @(42)
        new RazorExpression('42')
      ),
      result = view.execute();

  equal(result, '42');
});

test('razor expression using view model', function() {
  var view = transpile(// @model.bilbo
        new RazorExpression('model.bilbo')
      ),
      result = view.execute({ bilbo: 'baggins' });

  equal(result, 'baggins');
});

test('razor block with empty html element', function() {
  var view = transpile(// @{<div />}
        new RazorBlock([
          new Html('div', true, ' ')
        ])
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor if(true) statement expression with empty html element', function() {
  var view = transpile(// @if(true){<div />}
        new RazorControlFlowStatement('if',
          new RazorExpression('true'),
          new RazorBlock([
            new Html('div', true, ' ')
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor if(false) statement expression with empty html element', function() {
  var view = transpile(// @if(false){<div />}
        new RazorControlFlowStatement('if',
          new RazorExpression('false'),
          new RazorBlock([
            new Html('div', true, ' ')
          ])
        )
      ),
      result = view.execute();

  equal(result, '');
});

test('razor for loop statement expression with empty html element', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div /> }
        new RazorControlFlowStatement('for',
          new RazorExpression('var i = 0; i < 2; ++i'),
          new RazorBlock([
            new Html('div', true, ' ')
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div /><div />');
});

test('razor for loop statement expression with html element and loop variable', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div>@i</div> }
        new RazorControlFlowStatement('for',
          new RazorExpression('var i = 0; i < 2; ++i'),
          new RazorBlock([
            new Html('div', [], [
              new RazorExpression('i')
            ])
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div>0</div><div>1</div>');
});

test('razor for loop statement expression with loop variable and view model', function() {
  var view = transpile(// @for(var i = 0; i < model.d.length; ++i){ <div>@model.d[i]</div> }
        new RazorControlFlowStatement('for',
          new RazorExpression('var i = 0; i < model.d.length; ++i'),
          new RazorBlock([
            new Html('div', [], [
              new RazorExpression('model.d[i]')
            ])
          ])
        )
      ),
      result = view.execute({ d: ['alpha', 'bravo', 'charlie'] });

  equal(result, '<div>alpha</div><div>bravo</div><div>charlie</div>');
});
