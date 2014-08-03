import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorIfStatement extends RazorStatement {
  public test: RazorExpression;
  public body: RazorBlock;

  constructor(test: RazorExpression, body: RazorBlock){
    super();
    this.test = test;
    this.body = body;
  }
}

export = RazorIfStatement;
