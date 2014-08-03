import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorForLoop extends RazorStatement {
  public initialisation: RazorExpression;
  public condition: RazorExpression;
  public iteration: RazorExpression;
  public body: RazorBlock;

  constructor(initialisation: RazorExpression, condition: RazorExpression, iteration: RazorExpression, body: RazorBlock){
    super();
    this.initialisation = initialisation;
    this.condition = condition;
    this.iteration = iteration;
    this.body = body;
  }
}

export = RazorForLoop;
