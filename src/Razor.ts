/// <reference path="typings/node.d.ts" />
import TokenIterator = require('./tokens/TokenIterator');
import Parser = require('./parser/Parser');
import Transpiler = require('./transpiler/Transpiler');
import IView = require('./IView');
import fs = require('fs');

export function transpile(razorMarkup: string): new (model?: any) => IView {
  var tokenIterator = new TokenIterator(razorMarkup),
      parser = new Parser(tokenIterator),
      transpiler = new Transpiler(parser),
      viewClass = transpiler.transpile();

  return viewClass;
}

export function transpileFile(razorPath: string): new (model?: any) => IView {
  var source = fs.readFileSync(razorPath, {encoding: 'utf8'});
  return transpile(source);
}
