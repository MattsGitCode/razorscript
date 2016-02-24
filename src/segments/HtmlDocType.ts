import Segment = require('./Segment');

class HtmlDocType extends Segment {
  public name: string;

  constructor(name: string){
    super();
    this.name = name;
  }
}

export = HtmlDocType;
