import Segment = require('./Segment');

class RazorBlock extends Segment {
  public statements: Array<Segment>;

  constructor(statements: Array<Segment>){
    super();
    this.statements = statements;
  }
}

export = RazorBlock;
