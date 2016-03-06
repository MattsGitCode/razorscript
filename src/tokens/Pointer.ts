class Pointer {
  private _index: number = 0;
  public get index(): number {
    return this._index;
  }

  private _line: number = 0;
  public get line(): number {
    return this._line;
  }

  private _column: number = 0;
  public get column(): number {
    return this._column;
  }

  private _indexOfLineStart: number = 0;

  public clone(): Pointer {
    var clone = new Pointer();
    clone._index = this._index;
    clone._line = this._line;
    clone._column = this._column;
    clone._indexOfLineStart = this._indexOfLineStart;
    return clone;
  }

  public next(): void {
    this._index += 1;
    this._column += 1;
  }

  public nextLine(): void {
    this._index += 1;
    this._line += 1;
    this._column = 0;
    this._indexOfLineStart = this._index;
  }

  public toString(originalText?: string): string {
    var output = 'line: ' + this.line + ', column: ' + this.column;

    if (originalText) {
      var lineEnd = originalText.indexOf('\n', this._indexOfLineStart + 1);
      if (lineEnd === -1) {
        lineEnd = undefined;
      }

      var fullLine = originalText.substring(this._indexOfLineStart + 1, lineEnd);
      var visualisation = repeatedString('-', this.column) + '^';

      output = output + '\n\n' + fullLine + '\n' + visualisation;
    }

    return output;
  }
}

function repeatedString(repeatChar: string, stringLength: number): string {
  return Array(stringLength + 1).join(repeatChar);
}

export = Pointer;
