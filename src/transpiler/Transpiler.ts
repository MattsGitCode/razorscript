import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import HtmlAttributeSegment = require('../segments/HtmlAttribute');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorExpression = require('../segments/RazorExpression');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorForLoop = require('../segments/RazorForLoop');
import RazorHelper = require('../segments/RazorHelper');
import RazorVariableAssignment = require('../segments/RazorVariableAssignment');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorTernaryExpression = require('../segments/RazorTernaryExpression');
import IParser = require('../parser/IParser');
import IView = require('../IView');
import CodeBuilder = require('./CodeBuilder');

class Transpiler {
  private parser: IParser;
  private code: CodeBuilder;
  private transpiledClass: new (model?: any) => IView;
  private localVariables: Array<string> = [];

  constructor(parser: IParser) {
    this.parser = parser;
    this.code = new CodeBuilder();
  }

  public transpile(): new (model?: any) => IView {
    if (this.transpiledClass) {
      return this.transpiledClass;
    }

    this.transpiledClass = <new (model?: any) => IView>new Function('model', 'this.model = model;');

    var parsedSegments = this.parser.parse();

    parsedSegments.forEach(segment => {
      this.transpileSegment(segment);
    });

    var executeFunction: Function;
    try {
      executeFunction = new Function('model', this.code.toString());
    } catch (e) {
      throw new Error('Syntax error in transpiled code:\n' + this.code.toString());
    }
    this.transpiledClass.prototype.execute = executeFunction;

    return this.transpiledClass;
  }

  private transpileSegment(segment: Segment): void {
    if (segment instanceof HtmlSegment) {
      this.transpileHtmlSegment(<HtmlSegment>segment);
    } else if (segment instanceof RazorExpression) {
      this.transpileRazorExpression(<RazorExpression>segment);
    } else if (segment instanceof RazorIfStatement) {
      this.transpileRazorIfStatement(<RazorIfStatement>segment);
    } else if (segment instanceof RazorBlockSegment) {
      this.transpileRazorBlock(<RazorBlockSegment>segment);
    } else if (segment instanceof LiteralSegment) {
      this.code.literal((<LiteralSegment>segment).value);
    } else if (segment instanceof RazorHelper) {
      this.transpileRazorHelper(<RazorHelper>segment);
    } else if (segment instanceof RazorForLoop) {
      this.transpileRazorForLoop(<RazorForLoop>segment);
    } else if (segment instanceof RazorVariableAssignment) {
      this.transpileRazorVariableAssignment(<RazorVariableAssignment>segment);
    } else {
      throw new Error('transpileSegment(' + segment.getType() + '): not implemented');
    }
  }

  private transpileHtmlSegment(segment: HtmlSegment): void {
    this.code.startMarkup();
    this.code.literal(segment.leadingWhitespace + '<' + segment.tagName);

    segment.attributes.forEach(attr => this.transpileHtmlAttributeSegment(attr));

    if (segment.isEmpty) {
      this.code.literal(segment.whitespaceBeforeClosing + '/>');
    } else {
      this.code.literal('>');
      segment.children.forEach(c => this.transpileSegment(c));
      this.code.startMarkup();
      this.code.literal(segment.whitespaceBeforeClosing + '</' + segment.tagName + '>');
    }
  }

  private transpileHtmlAttributeSegment(segment: HtmlAttributeSegment): void {
    this.code.beginAttribute(segment.whitespacePrefix + segment.name + '=' + segment.quoteChar);

    segment.values.forEach(v => {
      if (v instanceof LiteralSegment) {
        var l = <LiteralSegment>v;
        this.code.literal(l.value);
      } else if (v instanceof RazorExpression) {
        var r = <RazorExpression>v;
        this.transpileRazorExpression(r);
      } else {
        throw new Error('Expected LiteralSegment or RazorExpressionSegment');
      }
    });

    this.code.endAttribute(segment.quoteChar);
  }

  private transpileRazorExpression(segment: RazorExpression, isPartial?: boolean): void {
    if (isPartial !== true) {
      this.code.openScope();
    }

    if (segment instanceof RazorVariableAccess) {
      this.transpileRazorVariableAccess(<RazorVariableAccess>segment);
    } else if (segment instanceof RazorLiteral) {
      this.transpileRazorLiteral(<RazorLiteral>segment);
    } else if (segment instanceof RazorMethodCall) {
      this.transpileRazorMethodCall(<RazorMethodCall>segment);
    } else if (segment instanceof RazorArrayAccess) {
      this.transpileRazorArrayAccess(<RazorArrayAccess>segment);
    } else if (segment instanceof RazorVariableAssignment) {
      this.transpileRazorVariableAssignment(<RazorVariableAssignment>segment);
    } else if (segment instanceof RazorUnaryExpression) {
      this.transpileRazorUnaryExpression(<RazorUnaryExpression>segment);
    } else if (segment instanceof RazorBinaryExpression) {
      this.transpileRazorBinaryExpression(<RazorBinaryExpression>segment);
    } else if (segment instanceof RazorTernaryExpression) {
      this.transpileRazorTernaryExpression(<RazorTernaryExpression>segment);
    } else {
      throw new Error('transpileRazorExpression(' + segment.getType() + '): not implemented');
    }

    if (isPartial !== true) {
      this.code.closeScope();
    }
  }

  private transpileRazorLiteral(segment: RazorLiteral): void {
    this.code.expression(segment.expression);
  }

  private transpileRazorVariableAssignment(segment: RazorVariableAssignment): void {
    this.code.declareVariable(segment.variable.name);
    this.code.directCode('var ' + segment.variable.name + ' = ');
    this.transpileRazorExpression(segment.expression, true);
  }

  private transpileRazorVariableAccess(segment: RazorVariableAccess): void {
    if (segment.object) {
      this.transpileRazorExpression(segment.object, true);
      this.code.expression('.' + segment.name);
    } else {
      if (this.code.isVariableDeclared(segment.name)) {
        this.code.expression(segment.name);
      } else {
        this.code.expression('this.' + segment.name);
      }
    }
  }

  private transpileRazorMethodCall(segment: RazorMethodCall): void {
    var expression = '';

    this.transpileRazorExpression(segment.accessor, true);
    this.code.expression('(');
    var isFirst = true;
    segment.arguments.forEach(a => {
      if (isFirst) {
        isFirst = false;
      } else {
        this.code.expression(',');
      }
      this.transpileRazorExpression(a, true);
    });
    this.code.expression(')');
  }

  private transpileRazorArrayAccess(segment: RazorArrayAccess): void {
    this.transpileRazorExpression(segment.accessor, true);
    this.code.expression('[');
    this.transpileRazorExpression(segment.argument, true);
    this.code.expression(']');
  }

  private transpileRazorIfStatement(segment: RazorIfStatement): void {
    this.code.startCode();
    this.code.directCode('if (');
    this.transpileRazorExpression(segment.test, true);
    this.code.directCode('){');

    this.transpileRazorBlock(segment.body);

    this.code.directCode('}');
  }

  private transpileRazorForLoop(segment: RazorForLoop): void {
    this.code.startCode();
    this.code.directCode('for(');
    this.transpileRazorExpression(segment.initialisation, true);
    this.code.directCode(';');
    this.transpileRazorExpression(segment.condition, true);
    this.code.directCode(';');
    this.transpileRazorExpression(segment.iteration, true);
    this.code.directCode('){');

    this.transpileRazorBlock(segment.body);

    this.code.directCode('}');
  }

  private transpileRazorUnaryExpression(segment: RazorUnaryExpression): void {
    this.code.directCode(segment.operator);
    this.transpileRazorExpression(segment.operand, true);
  }

  private transpileRazorBinaryExpression(segment: RazorBinaryExpression): void {
    this.transpileRazorExpression(segment.leftOperand, true);
    this.code.directCode(segment.operator);
    this.transpileRazorExpression(segment.rightOperand, true);
  }

  private transpileRazorTernaryExpression(segment: RazorTernaryExpression): void {
    this.transpileRazorExpression(segment.condition, true);
    this.code.directCode('?');
    this.transpileRazorExpression(segment.trueExpression, true);
    this.code.directCode(':');
    this.transpileRazorExpression(segment.falseExpression, true);
  }

  private transpileRazorBlock(segment: RazorBlockSegment): void {
    this.code.startCode();
    segment.statements.forEach(s => {
      this.transpileSegment(s);
      if (s instanceof RazorVariableAssignment) {
        this.code.directCode(';');
      }
    });
  }

  private transpileRazorHelper(segment: RazorHelper): void {
    var originalCodeBuilder = this.code;
    this.code = new CodeBuilder();
    segment.parameters.forEach(param => this.code.declareVariable(param));

    this.transpileRazorBlock(segment.block);

    var functionCreationParams = segment.parameters.slice();
    functionCreationParams.push(this.code.toString());

    var helperFunction: Function;
    try {
      helperFunction = Function.apply(null, functionCreationParams);
    } catch (e) {
      throw new Error('Syntax error in transpiled code for helper ' + segment.name + ': ' + this.code.toString());
    }

    this.transpiledClass.prototype[segment.name] = helperFunction;

    this.code = originalCodeBuilder;
  }
}


export = Transpiler;
