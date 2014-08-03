import Segment = require('../segments/Segment');
import Html = require('../segments/Html');
import Literal = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorExpression = require('../segments/RazorExpression');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorHelper = require('../segments/RazorHelper');
import IView = require('../IView');

import Transpiler = require('../transpiler/Transpiler');

QUnit.module('Transpiler Helpers');

var transpile = function(...segments: Array<Segment>): IView {
  var parser = { parse: function() { return segments; } },
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile(),
      viewInstance = new viewClass();

  return viewInstance;
};

test('call single parameter helper with simple html element', function() {
  var view = transpile(// @helper cup(drink){<div>cup of @drink</div>} @cup('tea')
        new RazorHelper('cup', ['drink'],
          new RazorBlock([
            new Html('div', '', '', [], [
              new Literal('cup of '),
              new RazorVariableAccess('drink')
            ])
          ])
        ),
        new RazorMethodCall(//'this.cup(\'tea\')')
          new RazorVariableAccess('cup'),
          [
            new RazorLiteral('"tea"')
          ]
        )
      );
      
  var result = view.execute();

  equal(result, '<div>cup of tea</div>');
});
