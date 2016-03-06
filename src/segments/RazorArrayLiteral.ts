import RazorExpression = require('./RazorExpression');

class RazorArrayLiteral extends RazorExpression {
  public elements: Array<RazorExpression>;

  constructor(elements: Array<RazorExpression>) {
    super();
    this.elements = elements;
  }
}

export = RazorArrayLiteral;
