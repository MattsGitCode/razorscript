import RazorExpression = require('./RazorExpression');

class RazorArrayAccess extends RazorExpression {
  public accessor: RazorExpression;
  public argument: RazorExpression;

  constructor(accessor: RazorExpression, argument: RazorExpression) {
    super();
    this.accessor = accessor;
    this.argument = argument;
  }
}

export = RazorArrayAccess;
