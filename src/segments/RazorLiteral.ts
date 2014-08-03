import RazorExpression = require('./RazorExpression');

class RazorLiteral extends RazorExpression {
  public expression: string;

  constructor(expression: string) {
    super();
    this.expression = expression;
  }
}

export = RazorLiteral;
