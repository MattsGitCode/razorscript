import Segment = require('../segments/Segment')

interface IParser {
  parse(): Array<Segment>;
}

export = IParser;
