class Segment {
  public getType(): string {
    return /function (.{1,})\(/.exec(this.constructor.toString())[1]
  }

  public leadingWhitespace: string;
}

export = Segment;
