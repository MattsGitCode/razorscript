import ISegment = require('./ISegment');
import HtmlAttribute = require('./HtmlAttribute');

class Html implements ISegment {
  public leadingWhitespace: string;
  public tagName: string;
  public whitespaceBeforeClosing: string;
  public attributes: Array<HtmlAttribute>;
  public children: Array<ISegment>;
  public isEmpty: boolean;

  constructor(tagName: string, leadingWhitespace: string);
  constructor(tagName: string, leadingWhitespace: string, attributes: Array<HtmlAttribute>);
  constructor(tagName: string, leadingWhitespace: string, isEmpty: boolean, whitespaceBeforeClosing: string, attributes?: Array<HtmlAttribute>);
  constructor(tagName: string, leadingWhitespace: string, attributes: Array<HtmlAttribute>, children: Array<ISegment>);
  constructor(tagName: string, leadingWhitespace: string, attributesOrIsEmpty?: any, whitespaceOrChildren?: any, attributesOrChildren?: Array<ISegment>) {
    this.leadingWhitespace = leadingWhitespace;
    this.tagName = tagName;
    this.isEmpty = attributesOrIsEmpty === true;

    if (attributesOrIsEmpty === false || attributesOrIsEmpty === true) {
      this.whitespaceBeforeClosing = whitespaceOrChildren;
      this.attributes = <Array<HtmlAttribute>>attributesOrChildren || [];
      this.children = [];
    } else if (attributesOrIsEmpty) {
      this.whitespaceBeforeClosing = '';
      this.attributes = attributesOrIsEmpty || [];
      this.children = whitespaceOrChildren || [];
    } else {
      this.whitespaceBeforeClosing = '';
      this.attributes = [];
      this.children = [];
    }
  }
}

export = Html;
