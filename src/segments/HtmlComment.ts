import Segment = require('./Segment');

class HtmlComment extends Segment {
  public leadingWhitespace: string;
  public text: string;

  constructor(leadingWhitespace: string, text: string){
    super();
    this.leadingWhitespace = leadingWhitespace;
    this.text = text;
  }
}

export = HtmlComment;
