import Segment = require('./Segment');
import RazorExpression = require('./RazorExpression');

class RazorInlineExpression extends Segment {
  public expression: RazorExpression;

  constructor(expression: RazorExpression) {
    super();
    this.expression = expression;
  }
}

export = RazorInlineExpression;
