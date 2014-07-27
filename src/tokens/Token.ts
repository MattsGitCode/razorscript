import TokenType = require('./TokenType');
import Pointer = require('./Pointer');

class Token {
  public static nullToken: Token = new Token(null, null, TokenType.undefined);

  private _pointer: Pointer;
  private _text: string;
  private _type: TokenType;

  constructor(pointer: Pointer, text: string, type: TokenType) {
    this._pointer = pointer;
    this._text = text;
    this._type = type;
  }

  public get text(): string {
    return this._text;
  }

  public get pointer(): Pointer {
    return this._pointer;
  }

  public get isWhitespace(): boolean {
    return this._type === TokenType.whitespace;
  }

  public get isRazor(): boolean {
    return this._type === TokenType.razor;
  }

  public get isOperator(): boolean {
    return this._type === TokenType.operator;
  }

  public get isAlpha(): boolean {
    return this._type === TokenType.alphanumeric;
  }

  public get isNumeric(): boolean {
    return this._type === TokenType.numeric;
  }

  public is(type: TokenType): boolean {
    return this._type === type;
  }
}

export = Token;
