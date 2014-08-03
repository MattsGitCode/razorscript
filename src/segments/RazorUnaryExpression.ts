import RazorExpression = require('./RazorExpression');

class RazorUnaryExpression extends RazorExpression {
  public operator: string;
  public operand: RazorExpression;

  constructor(operand: RazorExpression, operator: string) {
    super();
    this.operand = operand;
    this.operator = operator;
  }
}

export = RazorUnaryExpression;
