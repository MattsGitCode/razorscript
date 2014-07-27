import ISegment = require('./ISegment');

class RazorExpression implements ISegment {
  public expression: string;

  constructor(expression: string) {
    this.expression = expression;
  }
}

export = RazorExpression;
