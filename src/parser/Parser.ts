import ITokenIterator = require('../tokens/ITokenIterator');
import TokenType = require('../tokens/TokenType');
import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlock = require('../segments/RazorBlock');
import RazorExpression = require('../segments/RazorExpression');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorForLoop = require('../segments/RazorForLoop');
import RazorForEachLoop = require('../segments/RazorForEachLoop');
import RazorVariableAssignment = require('../segments/RazorVariableAssignment');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorTernaryExpression = require('../segments/RazorTernaryExpression');
import RazorHelper = require('../segments/RazorHelper');
import RazorComment = require('../segments/RazorComment');
import IParser = require('./IParser');

var keywords: Array<string> = ['if', 'do', 'while', 'for', 'foreach'];

class Parser {
  private iterator: ITokenIterator;
  public segments: Array<Segment>;

  constructor(iterator: ITokenIterator) {
    this.iterator = iterator;
    this.segments = [];
  }

  public parse(): Array<Segment> {
    while (!this.iterator.eof) {
      this.segments.push(this.parseSegment());
    }
    return this.segments;
  }

  private parseSegment(): Segment {
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

      return new HtmlSegment(tagName, leadingWhitespace, whitespaceBeforeClosing, true, attributes);
    }

    this.iterator.nowhitespace.consume('>');

    var children: Array<Segment> = [];
    while (!(this.iterator.nowhitespace.peek.text === '<' && this.iterator.nowhitespace.peekNext.text === '/')) {
      children.push(this.parseSegment());
    }

    var whitespaceBeforeClosing = '';
    if (this.iterator.peek.isWhitespace) {
      whitespaceBeforeClosing = this.iterator.consume().text;
    }

    this.iterator.consume('<');
    this.iterator.consume('/');
    this.iterator.consume(tagName);

    this.iterator.nowhitespace.consume('>');

    return new HtmlSegment(tagName, leadingWhitespace, whitespaceBeforeClosing, attributes, children);
  }

  private parseHtmlAttributeSegment(): HtmlAttributeSegment {
    var whitespacePrefix = this.iterator.consume(TokenType.whitespace).text
    var name = this.iterator.consume(TokenType.alphanumeric).text;
    this.iterator.nowhitespace.consume('=');

    var quoteChar = this.iterator.nowhitespace.consume(['"', "'"]).text;

    var valueSegments: Array<Segment> = [];
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

  private parseRazorSegment(): Segment {
    var segment: Segment;

    this.iterator.nowhitespace.consume('@');

    if (this.iterator.peek.isWhitespace) {
      throw new Error('@ cannot be followed by whitespace')
    } if (this.iterator.peek.isRazor) {
      segment = new LiteralSegment('@');
      this.iterator.consume();
    } else if (this.iterator.peek.text === '*') {
      segment = this.parseRazorComment();
    } else if (this.iterator.peek.text === 'helper') {
      segment = this.parseRazorHelper();
    } else if (keywords.indexOf(this.iterator.peek.text) !== -1) {
      segment = this.parseRazorStatement();
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

  private parseRazorSimpleExpression(): RazorExpression {
    if (this.iterator.nowhitespace.peek.isNumeric) {
      return new RazorLiteral(this.iterator.nowhitespace.consume().text);
    }
    if (['true','false'].indexOf(this.iterator.nowhitespace.peek.text) !== -1) {
      return new RazorLiteral(this.iterator.nowhitespace.consume().text);
    }

    var expression: RazorExpression;
    if (this.iterator.nowhitespace.peek.isAlpha) {
      expression = new RazorVariableAccess(this.iterator.nowhitespace.consume().text);
    } else if (['\'','"'].indexOf(this.iterator.nowhitespace.peek.text) !== -1) {
      expression = this.parseRazorStringLiteral();
    } else if (this.iterator.nowhitespace.peek.isNumeric) {
      expression = this.parseRazorNumberLiteral();
    } else {
      throw new Error('not implemented parseRazorSimpleExpresson for token \'' + this.iterator.nowhitespace.peek.text + '\' at ' + this.iterator.peek.pointer);
    }

    while(!this.iterator.eof) {
      if (this.iterator.peek.text === '.' && this.iterator.peekNext.isAlpha) {
        this.iterator.consume();
        expression = new RazorVariableAccess(this.iterator.consume().text, expression);
      } else if (this.iterator.peek.text === '[') {
        this.iterator.consume();
        expression = new RazorArrayAccess(expression, this.parseRazorSimpleExpression());
        this.iterator.consume(']');
      } else if (this.iterator.peek.text === '(') {
        this.iterator.consume();
        var args: Array<RazorExpression> = [];
        var isFirstParam = true;
        while(this.iterator.nowhitespace.peek.text !== ')') {
          if (isFirstParam) {
            isFirstParam = false;
          } else {
            this.iterator.nowhitespace.consume(',');
          }
          args.push(this.parseRazorSimpleExpression());
        }
        this.iterator.nowhitespace.consume(')');

        expression = new RazorMethodCall(expression, args);
      } else {
        break;
      }
    }

    return expression;
  }

  private parseRazorComment(): RazorComment {
    var commentParts: Array<string> = [];
    this.iterator.consume('*');
    while (!(this.iterator.peek.text === '*' && this.iterator.peekNext.text === '@')) {
      commentParts.push(this.iterator.consume().text);
    }
    this.iterator.consume('*');
    this.iterator.consume('@');

    return new RazorComment(commentParts.join(''));
  }

  private parseRazorStringLiteral(): RazorLiteral {
    var quote = this.iterator.nowhitespace.consume().text;
    var value = [];
    while(this.iterator.peek.text !== quote) {
      value.push(this.iterator.consume().text);
    }
    this.iterator.consume(quote);

    return new RazorLiteral(quote + value.join('') + quote);
  }

  private parseRazorNumberLiteral(): RazorLiteral {
    var number = this.iterator.nowhitespace.consume().text;
    return new RazorLiteral(number);
  }

  private parseRazorExpression(): RazorExpression {
    if (this.iterator.nowhitespace.peek.text === '++'){
      var op = this.iterator.nowhitespace.consume().text;
      var expression = this.parseRazorSimpleExpression();
      return new RazorUnaryExpression(expression, op);
    }

    var inBrackets = false;
    var expression: RazorExpression;

    if (this.iterator.nowhitespace.peek.text === '(') {
      this.iterator.nowhitespace.consume();
      inBrackets = true;
    }

    var expression = this.parseRazorSimpleExpression();

    var ops = ['++','<','>','==','?'];
    while(ops.indexOf(this.iterator.nowhitespace.peek.text) !== -1) {
      var op = this.iterator.nowhitespace.consume().text;
      if (op === '?') {
        var trueExpression = this.parseRazorSimpleExpression();
        this.iterator.nowhitespace.consume(':');
        var falseExpression = this.parseRazorSimpleExpression();
        expression = new RazorTernaryExpression(expression, trueExpression, falseExpression);
      } else {
        expression = new RazorBinaryExpression(expression, op, this.parseRazorSimpleExpression());
      }
    }



    if (inBrackets) {
      this.iterator.nowhitespace.consume(')');
    }

    return expression;
  }

  private parseRazorBlock(): RazorBlock {
    this.iterator.nowhitespace.consume('{');

    var statements: Array<Segment> = [];

    while(this.iterator.nowhitespace.peek.text !== '}') {
      var statement = this.parseRazorStatement();
      statements.push(statement);
    }

    this.iterator.nowhitespace.consume('}');

    return new RazorBlock(statements);
  }

  private parseRazorStatement(): Segment {
    if (this.iterator.nowhitespace.peek.text === '<') {
      return this.parseHtmlSegment();
    }

    return this.parseRazorCodeStatement();
  }

  private parseRazorCodeStatement(): Segment {
    if (this.iterator.nowhitespace.peek.text === 'if') {
      return this.parseIfStatement();
    }
    if (this.iterator.nowhitespace.peek.text === 'var') {
      var expression = this.parseVariableAssignment();
      this.iterator.consume(';');
      return expression;
    }
    if (this.iterator.nowhitespace.peek.text === 'for') {
      return this.parseForLoop();
    }
    if (this.iterator.nowhitespace.peek.text === 'foreach') {
      return this.parseForEachLoop();
    }

    var expression = this.parseRazorExpression();
    this.iterator.nowhitespace.consume(';');
    return expression;
  }

  private parseIfStatement(): RazorStatement {
    var test: RazorExpression,
        body: RazorBlock;

    this.iterator.nowhitespace.consume('if');
    this.iterator.nowhitespace.consume('(');

    test = this.parseRazorSimpleExpression();

    this.iterator.nowhitespace.consume(')');

    body = this.parseRazorBlock();

    return new RazorIfStatement(test, body);
  }

  private parseVariableAssignment(): RazorStatement {
    this.iterator.nowhitespace.consume('var');

    var leftSide = this.parseRazorSimpleExpression();
    if (leftSide instanceof RazorVariableAccess !== true) {
      throw new Error('expected variable on left side of assignment but found ' + leftSide.getType());
    }

    this.iterator.nowhitespace.consume('=');
    var expression = this.parseRazorSimpleExpression();

    return new RazorVariableAssignment(<RazorVariableAccess>leftSide, expression);
  }

  private parseForLoop(): RazorStatement {
    this.iterator.nowhitespace.consume('for');
    this.iterator.nowhitespace.consume('(');

    var initialisation = this.parseVariableAssignment();
    this.iterator.nowhitespace.consume(';');
    var condition = this.parseRazorExpression();
    this.iterator.nowhitespace.consume(';');
    var iteration = this.parseRazorExpression();

    this.iterator.nowhitespace.consume(')');
    var body = this.parseRazorBlock();

    return new RazorForLoop(initialisation, condition, iteration, body);
  }

  private parseForEachLoop(): RazorStatement {
    var loopVariable: string,
        collection: RazorExpression,
        body: RazorBlock;

    this.iterator.nowhitespace.consume('foreach');
    this.iterator.nowhitespace.consume('(');
    this.iterator.nowhitespace.consume('var');

    loopVariable = this.iterator.nowhitespace.consume(TokenType.alphanumeric).text;
    this.iterator.nowhitespace.consume('in');
    collection = this.parseRazorExpression();

    if (!(collection instanceof RazorVariableAccess)) {
      throw new Error('expected variable access for the collection of a foreach loop');
    }

    this.iterator.nowhitespace.consume(')');
    body = this.parseRazorBlock();

    return new RazorForEachLoop(loopVariable, collection, body);
  }

  private parseRazorHelper(): RazorHelper {
    this.iterator.consume('helper');

    var name = this.iterator.nowhitespace.consume(TokenType.alphanumeric).text;
    var parameters: Array<string> = [];
    this.iterator.nowhitespace.consume('(');
    var isFirst = true;
    while(this.iterator.nowhitespace.peek.text !== ')') {
      if (isFirst){
        isFirst = false;
      } else {
        this.iterator.nowhitespace.consume(',');
      }

      parameters.push(this.iterator.nowhitespace.consume(TokenType.alphanumeric).text);
    }
    this.iterator.nowhitespace.consume(')');

    var block = this.parseRazorBlock();

    return new RazorHelper(name, parameters, block);
  }
}

export = Parser;
