import RazorExpression = require('./RazorExpression');

class RazorVariableAccess extends RazorExpression {
  public name: string;
  public object: RazorExpression;

  constructor(name: string, object?: RazorExpression) {
    super();
    this.name = name;
    this.object = object;
  }
}

export = RazorVariableAccess;
