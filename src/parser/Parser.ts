import ITokenIterator = require('../tokens/ITokenIterator');
import TokenType = require('../tokens/TokenType');
import ISegment = require('../segments/ISegment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorExpressionSegment = require('../segments/RazorExpression');
import RazorStatementSegment = require('../segments/RazorStatement');
import RazorControlFlowStatement = require('../segments/RazorControlFlowStatement');
import IParser = require('./IParser');

var keywords: Array<string> = ['if', 'do', 'while', 'for', 'foreach'];

class Parser {
  private iterator: ITokenIterator;
  public segments: Array<ISegment>;

  constructor(iterator: ITokenIterator) {
    this.iterator = iterator;
    this.segments = [];
  }

  public parse(): Array<ISegment> {
    while (!this.iterator.eof) {
      this.segments.push(this.parseSegment());
    }
    return this.segments;
  }

  private parseSegment(): ISegment {
    if (this.iterator.nowhitespace.peek.isRazor) {
      return this.parseRazorSegment();
    }

    if (this.iterator.nowhitespace.peek.isOperator && this.iterator.nowhitespace.peek.text === '<') {
      return this.parseHtmlSegment();
    }

    return this.parseLiteralSegment();
  }

  private parseLiteralSegment(): LiteralSegment {
    var parts: Array<string> = [this.iterator.consume().text];

    var stops = ['<', '/', '>', '"', "'", '=', '@'];

    while (!this.iterator.eof && stops.indexOf(this.iterator.peek.text) === -1) {
      parts.push(this.iterator.consume().text);
    }

    return new LiteralSegment(parts.join(''));
  }

  private parseHtmlSegment(): HtmlSegment {
    var leadingWhitespace: string = '';
    if (this.iterator.peek.isWhitespace){
      leadingWhitespace = this.iterator.consume().text;
    }

    this.iterator.consume('<');
    var tagName = this.iterator.nowhitespace.consume().text;

    var attributes: Array<HtmlAttributeSegment> = [];
    while (['>', '/'].indexOf(this.iterator.nowhitespace.peek.text) === -1) {
      attributes.push(this.parseHtmlAttributeSegment());
    }

    if (this.iterator.nowhitespace.peek.text === '/') {
      var whitespaceBeforeClosing = '';
      if (this.iterator.peek.isWhitespace) {
        whitespaceBeforeClosing = this.iterator.peek.text;
      }
      this.iterator.nowhitespace.consume('/');
      this.iterator.nowhitespace.consume('>');

      return new HtmlSegment(tagName, leadingWhitespace, true, whitespaceBeforeClosing, attributes);
    }

    this.iterator.nowhitespace.consume('>');

    var children: Array<ISegment> = [];
    while (!(this.iterator.nowhitespace.peek.text === '<' && this.iterator.nowhitespace.peekNext.text === '/')) {
      children.push(this.parseSegment());
    }

    this.iterator.nowhitespace.consume('<');
    this.iterator.nowhitespace.consume('/');
    debugger;
    this.iterator.nowhitespace.consume(tagName);

    this.iterator.nowhitespace.consume('>');

    return new HtmlSegment(tagName, leadingWhitespace, attributes, children);
  }

  private parseHtmlAttributeSegment(): HtmlAttributeSegment {
    var whitespacePrefix = this.iterator.consume(TokenType.whitespace).text
    var name = this.iterator.consume(TokenType.alphanumeric).text;
    this.iterator.nowhitespace.consume('=');

    var quoteChar = this.iterator.nowhitespace.consume(['"', "'"]).text;

    var valueSegments: Array<ISegment> = [];
    while (this.iterator.peek.text != quoteChar) {
      if (this.iterator.peek.isRazor) {
        valueSegments.push(this.parseRazorSegment());
      } else {
        valueSegments.push(this.parseLiteralSegment());
      }
    }

    this.iterator.consume(quoteChar);

    return new HtmlAttributeSegment(name, quoteChar, whitespacePrefix, valueSegments);
  }

  private parseRazorSegment(): ISegment {
    var segment: ISegment;

    this.iterator.nowhitespace.consume('@');

    if (this.iterator.peek.isRazor) {
      segment = new LiteralSegment('@');
      this.iterator.consume();
    } else if (keywords.indexOf(this.iterator.peek.text) !== -1) {
      segment = this.parseControlFlowStatement();
    } else if (this.iterator.peek.isAlpha) {
      segment = this.parseRazorSimpleExpression();
    } else if (this.iterator.peek.text === '(') {
      segment = this.parseRazorExpression();
    } else if (this.iterator.peek.text === '{') {
      segment = this.parseRazorBlock();
    } else {
      throw new Error('parseRazorSegment: not implemented');
    }

    return segment;
  }

  private parseRazorSimpleExpression(): RazorExpressionSegment {
    var parts: Array<string> = [this.iterator.consume().text];

    while(!this.iterator.eof) {
      if (this.iterator.peek.text === '.' && this.iterator.peekNext.isAlpha) {
        parts.push(this.iterator.consume().text);
        parts.push(this.iterator.consume().text);
      } else if (this.iterator.peek.text === '[') {
        parts.push(this.iterator.consume().text);
        parts.push(this.parseRazorSimpleExpression().expression);
        parts.push(this.iterator.consume(']').text);
      } else if (this.iterator.peek.text === '(') {
        parts.push(this.iterator.consume().text);
        var isFirstParam = true;
        while(this.iterator.nowhitespace.peek.text !== ')') {
          if (isFirstParam) {
            parts.push(this.parseRazorSimpleExpression().expression);
            isFirstParam = false;
          } else {
            parts.push(this.iterator.nowhitespace.consume(',').text);
            parts.push(this.parseRazorSimpleExpression().expression);
          }
        }
        parts.push(this.iterator.nowhitespace.consume(')').text);
      } else {
        break;
      }
    }

    return new RazorExpressionSegment(parts.join(''));
  }

  private parseRazorExpression(stopChar?: string): RazorExpressionSegment {
    var parts: Array<string> = [];

    var stopTypes = { '(': ')', '[': ']', '{': '}' };

    var stop: string;
    if (!stopChar && stopTypes[this.iterator.nowhitespace.peek.text]) {
      var open = this.iterator.nowhitespace.consume().text;
      parts.push(open);
      stop = stopTypes[open];
    }

    while (!this.iterator.eof) {
      if (this.iterator.peek.text === stopChar) {
        break;
      }
      if (this.iterator.peek.text === stop) {
        parts.push(this.iterator.consume().text);
        break;
      }
      if (this.iterator.peek.isWhitespace && !stop && !stopChar) {
        break;
      }

      if (['(','[','{'].indexOf(this.iterator.nowhitespace.peek.text) !== -1) {
        var nested = this.parseRazorExpression();
        parts.push(nested.expression);
      } else if (this.iterator.peek.isWhitespace
            || this.iterator.peek.isAlpha
            || this.iterator.peek.isNumeric
            || ['.', '=', ';', '<', '>', '++', '==', '?', ':', '\'', '-'].indexOf(this.iterator.peek.text) !== -1) {
        parts.push(this.iterator.consume().text);
      } else if (!stop) {
        break;
      } else {
        throw new Error('unexpected char ' + this.iterator.peek.text);
      }
    }

    return new RazorExpressionSegment(parts.join(''));
  }

  private parseRazorBlock(): RazorBlockSegment {
    this.iterator.nowhitespace.consume('{');

    var statements: Array<ISegment> = [];

    while(this.iterator.nowhitespace.peek.text !== '}') {
      var statement = this.parseRazorStatement();
      statements.push(statement);
    }

    this.iterator.nowhitespace.consume('}');

    return new RazorBlockSegment(statements);
  }

  private parseRazorStatement(): ISegment {
    if (this.iterator.nowhitespace.peek.text === '<') {
      return this.parseHtmlSegment();
    }

    throw new Error('parseRazorStatement: not implemented');
  }

  private parseControlFlowStatement(): RazorControlFlowStatement {
    var type: string,
        expression: RazorExpressionSegment,
        block: RazorBlockSegment;

    type = this.iterator.nowhitespace.consume().text;

    this.iterator.nowhitespace.consume('(');

    expression = this.parseRazorExpression(')');

    this.iterator.nowhitespace.consume(')');
    block = this.parseRazorBlock();

    return new RazorControlFlowStatement(type, expression, block);
  }
}

export = Parser;
