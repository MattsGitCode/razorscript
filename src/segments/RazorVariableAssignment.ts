import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorVariableAccess = require('./RazorVariableAccess');

class RazorVariableAssignment extends RazorStatement {
  public variable: RazorVariableAccess;
  public expression: RazorExpression;

  constructor(variable: RazorVariableAccess, expression: RazorExpression){
    super();
    this.variable = variable;
    this.expression = expression;
  }
}

export = RazorVariableAssignment;
