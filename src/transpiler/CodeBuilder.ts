enum CodeBuilderState {
  Markup,
  Code,
}

function escape(val: string): string {
  return val.replace('\"', '\\\"').replace('\r', '\\r').replace('\n', '\\n');
}

class CodeBuilder {
  private code: Array<string>;
  private state: CodeBuilderState;
  private previousState: CodeBuilderState;
  private localVariables: Array<string>;

  constructor(){
    this.code = [];
    this.state = CodeBuilderState.Markup;
    this.localVariables = [];
  }

  public declareVariable(name: string): void {
    this.localVariables.push(name);
  }

  public isVariableDeclared(name: string): boolean {
    return this.localVariables.indexOf(name) !== -1;
  }

  public startMarkup(): void {
    this.state = CodeBuilderState.Markup;
  }

  public startCode(): void {
    this.state = CodeBuilderState.Code;
  }

  public literal(value: string): void {
    if (this.state === CodeBuilderState.Markup) {
      this.code.push('html.push("' + escape(value) + '");');
    } else {
      this.code.push(value);
    }
  }

  public expression(value: string): void {
    this.code.push(value);
  }

  public directCode(c: string): void {
    this.code.push(c);
  }

  public beginAttribute(start: string): void {
    this.code.push('(function(parentHtml){');
    this.code.push('var attrStart = "' + escape(start) + '";');
    this.code.push('var html = [];')
  }

  public endAttribute(end: string): void {
    this.code.push('var value = html.filter(function(x){return !!x;}).join(" ");');
    this.code.push('if (!!value){');
    this.code.push('parentHtml.push(attrStart + value + "' + escape(end) + '");');
    this.code.push('}');

    this.code.push('}.call(this, html));');
  }

  public openScope(): void {
    this.code.push('html.push(');
  }

  public closeScope(): void {
    this.code.push(');');
  }

  public toString(): string {
    var finalCode = 'var html = [];' +
        this.code.join('') +
        'return html.join("");';

    return finalCode;
  }
}

export = CodeBuilder;
