import ISegment = require('./ISegment');
import RazorBlock = require('./RazorBlock');

class RazorHelper implements ISegment {
  public name: string;
  public parameters: string;
  public block: RazorBlock;

  constructor(name: string, parameters: string, block: RazorBlock) {
    this.name = name;
    this.parameters = parameters;
    this.block = block;
  }
}

export = RazorHelper;
