import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');

class RazorVariableDeclaration extends RazorStatement {
  public name: string;
  public initialiser: RazorExpression;

  constructor(name: string, initialiser?: RazorExpression){
    super();
    this.name = name;
    this.initialiser = initialiser;
  }
}

export = RazorVariableDeclaration;
