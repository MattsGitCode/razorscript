import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorIfStatement extends RazorStatement {
  public test: RazorExpression;
  public body: RazorBlock;

  public elseifStatement: RazorIfStatement;
  public elseStatement: RazorBlock;

  constructor(test: RazorExpression, body: RazorBlock, elseifStatement?: RazorIfStatement, elseStatement?: RazorBlock){
    super();
    this.test = test;
    this.body = body;
    this.elseifStatement = elseifStatement;
    this.elseStatement = elseStatement;
  }
}

export = RazorIfStatement;
