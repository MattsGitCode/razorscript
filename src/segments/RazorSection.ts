import Segment = require('./Segment');
import RazorBlock = require('./RazorBlock');

class RazorSection extends Segment {
  public name: string;
  public block: RazorBlock;

  constructor(name: string, block: RazorBlock) {
    super();
    this.name = name;
    this.block = block;
  }
}

export = RazorSection;
