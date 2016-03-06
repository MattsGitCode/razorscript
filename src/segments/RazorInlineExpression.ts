import Segment = require('./Segment');
import RazorExpression = require('./RazorExpression');

class RazorInlineExpression extends Segment {
  public expression: RazorExpression;

  constructor(expression: RazorExpression, leadingWhitespace?: string) {
    super();
    this.expression = expression;
    this.leadingWhitespace = leadingWhitespace;
  }
}

export = RazorInlineExpression;
