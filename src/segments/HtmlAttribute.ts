import ISegment = require('./ISegment');

class HtmlAttribute implements ISegment {
  public name: string;
  public quoteChar: string;
  public values: Array<ISegment>;
  public whitespacePrefix: string;
  constructor(name: string, quoteChar: string, whitespacePrefix: string, values: Array<ISegment>) {
    this.name = name;
    this.quoteChar = quoteChar;
    this.whitespacePrefix = whitespacePrefix;
    this.values = values;
  }
}

export = HtmlAttribute;
