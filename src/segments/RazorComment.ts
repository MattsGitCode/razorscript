import Segment = require('./Segment');

class RazorComment extends Segment {
  public text: string;

  constructor(text: string){
    super();
    this.text = text;
  }
}

export = RazorComment;
