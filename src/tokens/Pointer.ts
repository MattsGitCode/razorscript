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

  public clone(): Pointer {
    var clone = new Pointer();
    clone._index = this._index;
    clone._line = this._line;
    clone._column = this._column;
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
  }

  public toString(): string {
    return 'line: ' + this.line + ', column: ' + this.column;
  }
}

export = Pointer;
