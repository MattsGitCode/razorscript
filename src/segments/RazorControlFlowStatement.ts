import ISegment = require('./ISegment');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorControlFlowStatement implements ISegment {
  public type: string;
  public expression: RazorExpression;
  public block: RazorBlock;

  constructor(type: string, expression: RazorExpression, block: RazorBlock){
    this.type = type;
    this.expression = expression;
    this.block = block;
  }
}

export = RazorControlFlowStatement;
