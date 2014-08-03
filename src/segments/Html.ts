import Segment = require('./Segment');
import HtmlAttribute = require('./HtmlAttribute');

class Html extends Segment {
  public leadingWhitespace: string;
  public tagName: string;
  public whitespaceBeforeClosing: string;
  public attributes: Array<HtmlAttribute>;
  public children: Array<Segment>;
  public isEmpty: boolean;

  constructor(tagName: string, leadingWhitespace: string, whitespaceBeforeClosing: string);
  constructor(tagName: string, leadingWhitespace: string, whitespaceBeforeClosing: string, attributes: Array<HtmlAttribute>);
  constructor(tagName: string, leadingWhitespace: string, whitespaceBeforeClosing: string, isEmpty: boolean, attributes?: Array<HtmlAttribute>);
  constructor(tagName: string, leadingWhitespace: string, whitespaceBeforeClosing: string, attributes: Array<HtmlAttribute>, children: Array<Segment>);
  constructor(tagName: string, leadingWhitespace: string, whitespaceBeforeClosing: string, attributesOrIsEmpty?: any, attributesOrChildren?: Array<Segment>) {
    super();
    this.leadingWhitespace = leadingWhitespace;
    this.tagName = tagName;
    this.whitespaceBeforeClosing = whitespaceBeforeClosing;
    this.isEmpty = attributesOrIsEmpty === true;

    if (attributesOrIsEmpty === false || attributesOrIsEmpty === true) {
      this.attributes = <Array<HtmlAttribute>>attributesOrChildren || [];
      this.children = [];
    } else if (attributesOrIsEmpty) {
      this.attributes = attributesOrIsEmpty || [];
      this.children = attributesOrChildren || [];
    } else {
      this.attributes = [];
      this.children = [];
    }
  }
}

export = Html;
