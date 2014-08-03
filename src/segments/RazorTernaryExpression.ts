import RazorExpression = require('./RazorExpression');

class RazorTernaryExpression extends RazorExpression {
  public condition: RazorExpression;
  public trueExpression: RazorExpression;
  public falseExpression: RazorExpression;

  constructor(condition: RazorExpression, trueExpression: RazorExpression, falseExpression: RazorExpression) {
    super();
    this.condition = condition;
    this.trueExpression = trueExpression;
    this.falseExpression = falseExpression;
  }
}

export = RazorTernaryExpression;
