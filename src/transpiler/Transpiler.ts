import ISegment = require('../segments/ISegment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorExpressionSegment = require('../segments/RazorExpression');
import RazorStatementSegment = require('../segments/RazorStatement');
import RazorControlFlowStatement = require('../segments/RazorControlFlowStatement');
import IParser = require('../parser/IParser');
import IView = require('../IView');
import CodeBuilder = require('./CodeBuilder');

class Transpiler {
  private parser: IParser;
  private code: CodeBuilder;
  private transpiledClass: new () => IView;

  constructor(parser: IParser) {
    this.parser = parser;
    this.code = new CodeBuilder();
  }

  public transpile(): new () => IView {
    if (this.transpiledClass) {
      return this.transpiledClass;
    }

    var parsedSegments = this.parser.parse();

    parsedSegments.forEach(segment => {
      this.transpileSegment(segment);
    });

    this.transpiledClass = <new () => IView>new Function();

    var executeFunction: Function;
    try {
      executeFunction = new Function('model', this.code.toString());
    } catch (e) {
      throw new Error('Syntax error in transpiled code');
    }
    this.transpiledClass.prototype.execute = executeFunction;

    return this.transpiledClass;
  }

  private transpileSegment(segment: ISegment): void {
    if (segment instanceof HtmlSegment) {
      this.transpileHtmlSegment(<HtmlSegment>segment);
    } else if (segment instanceof RazorExpressionSegment) {
      this.transpileRazorExpressionSegment(<RazorExpressionSegment>segment);
    } else if (segment instanceof RazorControlFlowStatement) {
      this.transpileRazorControlFlowStatement(<RazorControlFlowStatement>segment);
    } else if (segment instanceof RazorBlockSegment) {
      this.transpileRazorBlock(<RazorBlockSegment>segment);
    } else if (segment instanceof LiteralSegment) {
      this.code.literal((<LiteralSegment>segment).value);
    } else {
      console.log(segment);
      var type = /function (.{1,})\(/.exec(segment.constructor.toString())[1]
      throw new Error('transpileSegment(' + type + '): not implemented');
    }
  }

  private transpileHtmlSegment(segment: HtmlSegment): void {
    this.code.literal('<' + segment.tagName);

    segment.attributes.forEach(attr => this.transpileHtmlAttributeSegment(attr));

    if (segment.isEmpty) {
      this.code.literal(segment.whitespaceBeforeClosing + '/>');
    } else {
      this.code.literal('>');
      segment.children.forEach(c => this.transpileSegment(c));
      this.code.literal('</' + segment.tagName + '>');
    }
  }

  private transpileHtmlAttributeSegment(segment: HtmlAttributeSegment): void {
    this.code.beginAttribute(segment.whitespacePrefix + segment.name + '=' + segment.quoteChar);

    segment.values.forEach(v => {
      if (v instanceof LiteralSegment) {
        var l = <LiteralSegment>v;
        this.code.attributeLiteralValue(l.value);
      } else if (v instanceof RazorExpressionSegment) {
        var r = <RazorExpressionSegment>v;
        this.code.attributeExpressionValue(r.expression);
      } else {
        throw new Error('Expected LiteralSegment or RazorExpressionSegment');
      }
    });

    this.code.endAttribute(segment.quoteChar);
  }

  private transpileRazorExpressionSegment(segment: RazorExpressionSegment): void {
    this.code.expression(segment.expression);
  }

  private transpileRazorControlFlowStatement(segment: RazorControlFlowStatement): void {
    this.code.beginFlow(segment.type, segment.expression.expression);
    this.transpileRazorBlock(segment.block);
    this.code.endFlow();
  }

  private transpileRazorBlock(segment: RazorBlockSegment): void {
    segment.statements.forEach(s => {
      this.transpileSegment(s);
    });
  }
}


export = Transpiler;
