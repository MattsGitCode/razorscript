import ISegment = require('./ISegment');

class RazorBlock implements ISegment {
  public statements: Array<ISegment>;

  constructor(statements: Array<ISegment>){
    this.statements = statements;
  }
}

export = RazorBlock;
