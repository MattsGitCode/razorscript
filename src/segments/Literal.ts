import ISegment = require('./ISegment');

class Literal implements ISegment {
  public value: string;

  constructor(literal: string){
    this.value = literal;
  }
}

export = Literal;
