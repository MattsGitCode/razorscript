enum CodeBuilderState {
  Normal,
  AttributeClosure,
}

function escape(val: string): string {
  return val.replace('\"', '\\\"');
}

class CodeBuilder {
  private code: Array<string>;
  private state: CodeBuilderState;

  constructor(){
    this.code = [];
    this.state = CodeBuilderState.Normal;
  }

  public literal(value: string): void {
    if (this.state !== CodeBuilderState.Normal) {
      throw new Error('invalid operation');
    }

    this.code.push('html.push("' + escape(value) + '");');
  }

  public expression(value: string): void {
    if (this.state !== CodeBuilderState.Normal) {
      throw new Error('invalid operation');
    }

    this.code.push('html.push(' + value + ');');
  }

  public beginAttribute(start: string): void {
    this.state = CodeBuilderState.AttributeClosure;
    this.code.push('(function(){');
    this.code.push('var attrStart = "' + escape(start) + '";');
    this.code.push('var attrVals = [];')
  }

  public endAttribute(end: string): void {
    if (this.state !== CodeBuilderState.AttributeClosure) {
      throw new Error('no attribute closure is currently open');
    }

    this.code.push('var value = attrVals.filter(function(x){return !!x;}).join(" ");');
    this.code.push('if (!!value){');
    this.code.push('html.push(attrStart + value + "' + escape(end) + '");');
    this.code.push('}');

    this.code.push('}());');

    this.state = CodeBuilderState.Normal;
  }

  public attributeLiteralValue(value: string): void {
    if (this.state !== CodeBuilderState.AttributeClosure) {
      throw new Error('no attribute closure is currently open');
    }

    this.code.push('attrVals.push("' + escape(value) + '");');
  }

  public attributeExpressionValue(expression: string): void {
    if (this.state !== CodeBuilderState.AttributeClosure) {
      throw new Error('no attribute closure is currently open');
    }

    this.code.push('attrVals.push(' + expression + ');');
  }

  public beginFlow(type: string, expression: string): void {
    this.code.push(type + '(' + expression + '){');
  }

  public endFlow(): void {
    this.code.push('}');
  }

  public toString(): string {
    var finalCode = 'var html = [];' +
        this.code.join('') +
        'return html.join("");';

    return finalCode;
  }
}

export = CodeBuilder;
