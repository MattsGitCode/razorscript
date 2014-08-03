import Segment = require('./Segment');

class HtmlAttribute extends Segment {
  public name: string;
  public quoteChar: string;
  public values: Array<Segment>;
  public whitespacePrefix: string;
  constructor(name: string, quoteChar: string, whitespacePrefix: string, values: Array<Segment>) {
    super();
    this.name = name;
    this.quoteChar = quoteChar;
    this.whitespacePrefix = whitespacePrefix;
    this.values = values;
  }
}

export = HtmlAttribute;
