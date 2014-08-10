import RazorStatement = require('./RazorStatement');
import RazorExpression = require('./RazorExpression');
import RazorBlock = require('./RazorBlock');

class RazorForEachLoop extends RazorStatement {
  public loopVariable: string;
  public collection: RazorExpression;
  public body: RazorBlock;

  constructor(loopVariable: string, collection: RazorExpression, body: RazorBlock){
    super();
    this.loopVariable = loopVariable;
    this.collection = collection;
    this.body = body;
  }
}

export = RazorForEachLoop;
