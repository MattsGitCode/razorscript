import Segment = require('../segments/Segment');
import RazorComment = require('../segments/RazorComment');
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
import RazorForEachLoop = require('../segments/RazorForEachLoop');
import RazorHelper = require('../segments/RazorHelper');
import RazorSection = require('../segments/RazorSection');
import RazorVariableDeclaration = require('../segments/RazorVariableDeclaration');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorTernaryExpression = require('../segments/RazorTernaryExpression');
import RazorInlineExpression = require('../segments/RazorInlineExpression');
import IParser = require('../parser/IParser');
import IView = require('../IView');
import CodeBuilder = require('./CodeBuilder');
import HtmlString = require('./HtmlString');

class Transpiler {
  private parser: IParser;
  private code: CodeBuilder;
  private transpiledClass: new (model?: any) => IView;
  private localVariables: Array<string> = [];
  public helpers: any;

  constructor(parser: IParser) {
    this.parser = parser;
    this.code = new CodeBuilder();
  }

  public transpile(): new (model?: any) => IView {
    if (this.transpiledClass) {
      return this.transpiledClass;
    }

    this.transpiledClass = <new (model?: any) => IView><any>function(model) {
      this.model = model;
      var HtmlString = this.HtmlString;
      this.helpers = {
        raw: function(val) { return new HtmlString(val); }
      };
      this.html = this.helpers;
    };

    this.transpiledClass.prototype._sections = {};
    this.transpiledClass.prototype.renderSection = function(name) {
      if (this.model._sections && this.model._sections[name]) {
        var sectionHtml = this.model._sections[name].call(this.model);
        return sectionHtml;
      }
    };
    this.transpiledClass.prototype.HtmlString = HtmlString;

    this.transpiledClass.prototype.escapeHtml = function(val: any): string {
      if (val === null) {
        return '';
      }
      if (val instanceof this.HtmlString) {
        return val.html;
      }
      return val.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
    }

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
    if (segment instanceof RazorComment) {
      // Don't transpile razor comments
    } else if (segment instanceof HtmlSegment) {
      this.transpileHtmlSegment(<HtmlSegment>segment);
    } else if (segment instanceof RazorInlineExpression) {
      this.code.openScope();
      this.transpileRazorExpression((<RazorInlineExpression>segment).expression);
      this.code.closeScope();
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
    } else if (segment instanceof RazorSection) {
      this.transpileRazorSection(<RazorSection>segment);
    } else if (segment instanceof RazorForLoop) {
      this.transpileRazorForLoop(<RazorForLoop>segment);
    } else if (segment instanceof RazorForEachLoop) {
      this.transpileRazorForEachLoop(<RazorForEachLoop>segment);
    } else if (segment instanceof RazorVariableDeclaration) {
      this.transpileRazorVariableDeclaration(<RazorVariableDeclaration>segment);
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
      } else if (v instanceof RazorInlineExpression) {
        var r = <RazorInlineExpression>v;
        this.code.openScope();
        this.transpileRazorExpression(r.expression);
        this.code.closeScope();
      } else {
        throw new Error('Expected LiteralSegment or RazorInlineExpression');
      }
    });

    this.code.endAttribute(segment.quoteChar);
  }

  private transpileRazorExpression(segment: RazorExpression): void {
    if (segment instanceof RazorVariableAccess) {
      this.transpileRazorVariableAccess(<RazorVariableAccess>segment);
    } else if (segment instanceof RazorLiteral) {
      this.transpileRazorLiteral(<RazorLiteral>segment);
    } else if (segment instanceof RazorMethodCall) {
      this.transpileRazorMethodCall(<RazorMethodCall>segment);
    } else if (segment instanceof RazorArrayAccess) {
      this.transpileRazorArrayAccess(<RazorArrayAccess>segment);
    } else if (segment instanceof RazorVariableDeclaration) {
      this.transpileRazorVariableDeclaration(<RazorVariableDeclaration>segment);
    } else if (segment instanceof RazorUnaryExpression) {
      this.transpileRazorUnaryExpression(<RazorUnaryExpression>segment);
    } else if (segment instanceof RazorBinaryExpression) {
      this.transpileRazorBinaryExpression(<RazorBinaryExpression>segment);
    } else if (segment instanceof RazorTernaryExpression) {
      this.transpileRazorTernaryExpression(<RazorTernaryExpression>segment);
    } else {
      throw new Error('transpileRazorExpression(' + segment.getType() + '): not implemented');
    }
  }

  private transpileRazorLiteral(segment: RazorLiteral): void {
    this.code.directCode(segment.expression);
  }

  private transpileRazorVariableDeclaration(segment: RazorVariableDeclaration): void {
    this.code.declareVariable(segment.name);
    this.code.directCode('var ' + segment.name);
    if (segment.initialiser) {
      this.code.directCode(' = ');
      this.transpileRazorExpression(segment.initialiser);
    }
  }

  private transpileRazorVariableAccess(segment: RazorVariableAccess): void {
    if (segment.object) {
      this.transpileRazorExpression(segment.object);
      this.code.directCode('.' + segment.name);
    } else {
      if (this.code.isVariableDeclared(segment.name)) {
        this.code.directCode(segment.name);
      } else {
        this.code.directCode('this.' + segment.name);
      }
    }
  }

  private transpileRazorMethodCall(segment: RazorMethodCall): void {
    var expression = '';

    this.transpileRazorExpression(segment.accessor);
    this.code.directCode('(');
    var isFirst = true;
    segment.arguments.forEach(a => {
      if (isFirst) {
        isFirst = false;
      } else {
        this.code.directCode(',');
      }
      this.transpileRazorExpression(a);
    });
    this.code.directCode(')');
  }

  private transpileRazorArrayAccess(segment: RazorArrayAccess): void {
    this.transpileRazorExpression(segment.accessor);
    this.code.directCode('[');
    this.transpileRazorExpression(segment.argument);
    this.code.directCode(']');
  }

  private transpileRazorIfStatement(segment: RazorIfStatement): void {
    this.code.startCode();
    this.code.directCode('if (');
    this.transpileRazorExpression(segment.test);
    this.code.directCode('){');

    this.transpileRazorBlock(segment.body);

    this.code.directCode('}');
  }

  private transpileRazorForLoop(segment: RazorForLoop): void {
    this.code.startCode();
    this.code.directCode('for(');
    this.transpileRazorExpression(segment.initialisation);
    this.code.directCode(';');
    this.transpileRazorExpression(segment.condition);
    this.code.directCode(';');
    this.transpileRazorExpression(segment.iteration);
    this.code.directCode('){');

    this.transpileRazorBlock(segment.body);

    this.code.directCode('}');
  }

  private transpileRazorForEachLoop(segment: RazorForEachLoop): void {
    this.code.startCode();
    this.transpileRazorExpression(segment.collection);
    this.code.directCode('.forEach(function(' + segment.loopVariable + '){');
    this.code.declareVariable(segment.loopVariable);
    this.transpileRazorBlock(segment.body);
    this.code.directCode('},this);');
  }

  private transpileRazorUnaryExpression(segment: RazorUnaryExpression): void {
    this.code.directCode(segment.operator);
    this.transpileRazorExpression(segment.operand);
  }

  private transpileRazorBinaryExpression(segment: RazorBinaryExpression): void {
    this.transpileRazorExpression(segment.leftOperand);
    this.code.directCode(segment.operator);
    this.transpileRazorExpression(segment.rightOperand);
  }

  private transpileRazorTernaryExpression(segment: RazorTernaryExpression): void {
    this.transpileRazorExpression(segment.condition);
    this.code.directCode('?');
    this.transpileRazorExpression(segment.trueExpression);
    this.code.directCode(':');
    this.transpileRazorExpression(segment.falseExpression);
  }

  private transpileRazorBlock(segment: RazorBlockSegment): void {
    this.code.startCode();
    segment.statements.forEach(s => {
      this.transpileSegment(s);
      if (s instanceof RazorExpression || s instanceof RazorVariableDeclaration) {
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
    functionCreationParams.push(this.code.toHtmlString());

    var helperFunction: Function;
    try {
      helperFunction = Function.apply(null, functionCreationParams);
    } catch (e) {
      throw new Error('Syntax error in transpiled code for helper ' + segment.name + ': ' + this.code.toString());
    }

    this.transpiledClass.prototype[segment.name] = helperFunction;

    this.code = originalCodeBuilder;
  }

  private transpileRazorSection(segment: RazorSection): void {
    var originalCodeBuilder = this.code;
    this.code = new CodeBuilder();

    this.transpileRazorBlock(segment.block);
    var sectionFunction: Function;
    try {
      sectionFunction = Function.call(null, this.code.toHtmlString());
    } catch (e) {
      throw new Error('Syntax error in transpiled code for section ' + segment.name + ': ' + this.code.toString());
    }

    this.transpiledClass.prototype._sections[segment.name] = sectionFunction;

    this.code = originalCodeBuilder;
  }
}


export = Transpiler;
