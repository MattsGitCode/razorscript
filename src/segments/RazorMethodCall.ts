import RazorExpression = require('./RazorExpression');

class RazorMethodCall extends RazorExpression {
  public accessor: RazorExpression;
  public arguments: Array<RazorExpression>;

  constructor(accessor: RazorExpression, args: Array<RazorExpression>) {
    super();
    this.accessor = accessor;
    this.arguments = args;
  }
}

export = RazorMethodCall;
