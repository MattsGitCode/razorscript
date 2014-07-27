import TokenIterator = require('./tokens/TokenIterator');
import Parser = require('./parser/Parser');
import Transpiler = require('./transpiler/Transpiler');
import IView = require('./IView');

export function transpile(razorMarkup: string): new () => IView {
  var tokenIterator = new TokenIterator(razorMarkup),
      parser = new Parser(tokenIterator),
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile();

  return viewClass;
}
