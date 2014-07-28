import ISegment = require('../segments/ISegment');
import Html = require('../segments/Html');
import Literal = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorExpression = require('../segments/RazorExpression');
import RazorHelper = require('../segments/RazorHelper');
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

test('call single parameter helper with simple html element', function() {
  var view = transpile(// @helper cup(drink){<div>cup of @drink</div>} @cup('tea')
        new RazorHelper('cup', 'drink',
          new RazorBlock([
            new Html('div', '', '', [], [
              new Literal('cup of '),
              new RazorExpression('drink')
            ])
          ])
        ),
        new RazorExpression('this.cup(\'tea\')')
      ),
      result = view.execute();

  equal(result, '<div>cup of tea</div>');
});
