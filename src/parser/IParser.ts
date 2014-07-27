import Segment = require('../segments/ISegment')

interface IParser {
  parse(): Array<Segment>;
}

export = IParser;
