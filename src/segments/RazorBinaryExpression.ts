import RazorExpression = require('./RazorExpression');

class RazorBinaryExpression extends RazorExpression {
  public leftOperand: RazorExpression;
  public operator: string;
  public rightOperand: RazorExpression;

  constructor(leftOperand: RazorExpression, operator: string, rightOperand: RazorExpression) {
    super();
    this.leftOperand = leftOperand;
    this.operator = operator;
    this.rightOperand = rightOperand;
  }
}

export = RazorBinaryExpression;
