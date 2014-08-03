import Segment = require('./Segment');

class Literal extends Segment {
  public value: string;

  constructor(literal: string){
    super();
    this.value = literal;
  }
}

export = Literal;
