import Segment = require('../segments/Segment');
import Html = require('../segments/Html');
import HtmlAttribute = require('../segments/HtmlAttribute');
import Literal = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorForLoop = require('../segments/RazorForLoop');
import RazorForEachLoop = require('../segments/RazorForEachLoop');
import RazorVariableDeclaration = require('../segments/RazorVariableDeclaration');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorTernaryExpression = require('../segments/RazorTernaryExpression');
import RazorInlineExpression = require('../segments/RazorInlineExpression');
import RazorComment = require('../segments/RazorComment');
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler Razor');

var transpile = function(model?: any, ...segments: Array<Segment>): IView {
  if (model instanceof Segment) {
    segments.unshift(<Segment>model);
    model = null;
  }
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass(model);

  return viewInstance;
};

test('razor expression with literal string', function() {
  var view = transpile(// @("hello")
        new RazorInlineExpression(
          new RazorLiteral('"hello"')
        )
      ),
      result = view.execute();

  equal(result, 'hello');
});

test('razor expression with literal number', function() {
  var view = transpile(// @(42)
        new RazorInlineExpression(
          new RazorLiteral('42')
        )
      ),
      result = view.execute();

  equal(result, '42');
});

test('razor expression using view model', function() {
  var model = { bilbo: 'baggins' },
      view = transpile(// @model.bilbo
        model,
        new RazorInlineExpression(
          new RazorVariableAccess('bilbo',
            new RazorVariableAccess('model', null))
        )
      );

  var result = view.execute();

  equal(result, 'baggins');
});

test('razor block with empty html element', function() {
  var view = transpile(// @{<div />}
        new RazorBlock([
          new Html('div', '', ' ', true)
        ])
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor block with variable declaration', function() {
  var view = transpile(// @{var x = 42;}
        new RazorBlock([
          new RazorVariableDeclaration(
            'x',
            new RazorLiteral('42')
          )
        ])
      ),
      code = view.execute.toString();

  ok(/;var x = 42;/.test(code), 'expected execute body to contain var x = 42;');
});

test('razor block with variable assignment', function() {
  var view = transpile(// @{x = 42;}
        new RazorBlock([
          new RazorBinaryExpression(
            new RazorVariableAccess('x'),
            '=',
            new RazorLiteral('42')
          )
        ])
      ),
      code = view.execute.toString();

  ok(/;this\.x=42;/.test(code), 'expected execute body to contain this.x=42;');
});

test('razor if(true) statement expression with empty html element', function() {
  var view = transpile(// @if(true){<div />}
        new RazorIfStatement(
          new RazorLiteral('true'),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div />');
});

test('razor if(false) statement expression with empty html element', function() {
  var view = transpile(// @if(false){<div />}
        new RazorIfStatement(
          new RazorLiteral('false'),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      ),
      result = view.execute();

  equal(result, '');
});

test('razor for loop statement expression with empty html element', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div /> }
        new RazorForLoop(
          new RazorVariableDeclaration(
            'i',
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorLiteral('2')
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', ' ', true)
          ])
        )
      );
  var result = view.execute();

  equal(result, '<div /><div />');
});

test('razor for loop statement expression with html element and loop variable', function() {
  var view = transpile(// @for(var i = 0; i < 2; ++i){ <div>@i</div> }
        new RazorForLoop(
          new RazorVariableDeclaration(
            'i',
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorLiteral('2')
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', '', [], [
              new RazorInlineExpression(
                new RazorVariableAccess('i')
              )
            ])
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div>0</div><div>1</div>');
});

test('razor for loop statement expression with loop variable and view model', function() {
  var view = transpile(// @for(var i = 0; i < model.d.length; ++i){ <div>@model.d[i]</div> }
        { d: ['alpha', 'bravo', 'charlie'] },
        new RazorForLoop(
          new RazorVariableDeclaration(
            'i',
            new RazorLiteral('0')
          ),
          new RazorBinaryExpression(
            new RazorVariableAccess('i'),
            '<',
            new RazorVariableAccess('length',
              new RazorVariableAccess('d',
                new RazorVariableAccess('model')
              )
            )
          ),
          new RazorUnaryExpression(
            new RazorVariableAccess('i'),
            '++'
          ),
          new RazorBlock([
            new Html('div', '', '', [], [
              new RazorInlineExpression(
                new RazorArrayAccess(
                  new RazorVariableAccess('d',
                    new RazorVariableAccess('model')
                  ),
                  new RazorVariableAccess('i')
                )
              )
            ])
          ])
        )
      ),
      result = view.execute();

  equal(result, '<div>alpha</div><div>bravo</div><div>charlie</div>');
});

test('variable access without declaration is transpiled to access of a this property', function(){
  var view = transpile(
        new RazorBlock([
          new RazorVariableAccess('test')
        ])
      ),
      executeBody = view.execute.toString();

  ok(/;this\.test;/.test(executeBody), 'expected execute body to contain this.test');
});

test('variable access with previous declaration is transpiled as-is', function(){
  var view = transpile(
        new RazorBlock([
          new RazorVariableDeclaration('test'),
          new RazorVariableAccess('test')
        ])
      ),
      executeBody = view.execute.toString();

  ok(/;test;/.test(executeBody), 'expected execute body to contain test');
});

test('empty foreach loop with collection variable', function() {
  var view = transpile(
        new RazorForEachLoop(
          'abc',
          new RazorVariableAccess('def'),
          new RazorBlock([])
        )
      ),
      executeBody = view.execute.toString();

  ok(/this\.def\.forEach\(function\(abc\){},this\);/.test(executeBody), 'expected execute body to contain this.def.forEach(function(abc){},this);');
});

test('razor comments are ignored', function() {
  var view = transpile(
        new RazorComment('alpha')
      ),
      executeBody = view.execute.toString();

  ok(!/alpha/.test(executeBody), 'did not expect execute body to contain the comment text');
});

test('razor literal expressions are html encoded', function() {
  var view = transpile(
        new RazorInlineExpression(new RazorLiteral('"<br />"'))
      ),
      result = view.execute();

  equal(result, '&lt;br /&gt;');
});

test('razor variable expressions are html encoded', function() {
  var view = transpile(
        new RazorBlock([
          new RazorVariableDeclaration('foo', new RazorLiteral('"<br />"'))
        ]),
        new RazorInlineExpression(new RazorVariableAccess('foo'))
      ),
      result = view.execute();

  equal(result, '&lt;br /&gt;');
});
