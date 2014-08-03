import Segment = require('./Segment');
import RazorBlock = require('./RazorBlock');

class RazorHelper extends Segment {
  public name: string;
  public parameters: Array<string>;
  public block: RazorBlock;

  constructor(name: string, parameters: Array<string>, block: RazorBlock) {
    super();
    this.name = name;
    this.parameters = parameters;
    this.block = block;
  }
}

export = RazorHelper;
