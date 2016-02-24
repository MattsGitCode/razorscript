import TokenType = require('./TokenType');
import Token = require('./Token');
import Pointer = require('./Pointer');
import ITokenIterator = require('./ITokenIterator');

class TokenIterator implements ITokenIterator {
  private _original: string;
  private _length: number;

  private _queue: Array<Token>;
  private _nextPointer: Pointer;


  private _eof: boolean = false;

  constructor(razor: string) {
    if (!razor) {
      throw new Error('razor markup must be specified');
    }

    this._original = razor;
    this._length = razor.length;
    this._queue = [];
    this._nextPointer = new Pointer();

    this.fillQueue(2);
  }

  public get nowhitespace(): ITokenIterator {
    var it: TokenIterator = this;
    it.fillQueue(4);
    return {
      get eof(): boolean {
        return it.eof;
      },
      get peek(): Token {
        return it._queue[0].isWhitespace ? it._queue[1] : it._queue[0];
      },
      get peekNext(): Token {
        if (it._queue[0].isWhitespace) {
          return it._queue[2].isWhitespace ? it._queue[3] : it._queue[2];
        } else {
          return it._queue[1].isWhitespace ? it._queue[2] : it._queue[1];
        }
      },
      consume(expected?: any): Token{
        if (it._queue[0].isWhitespace) {
          it._queue.shift();
        }

        return it.consume(expected);
      },
      get nowhitespace(): ITokenIterator {
        return this;
      }
    };
  }

  public get eof(): boolean {
    return this._eof;
  }

  public get peek(): Token {
    return this._queue[0];
  }

  public get peekNext(): Token {
    return this._queue[1];
  }

  public consume(expected: string): Token;
  public consume(expected: Array<string>): Token;
  public consume(expected: TokenType): Token;
  public consume(): Token;
  public consume(expected?: any): Token {
    var readResult: ITokenReadResult;

    if (this._eof) {
      throw new Error('Reached end of file');
    }

    var tokenToConsume = this._queue.shift();

    if (expected) {
      var error: Error;

      if (expected) {
        error = this.checkIsExpected(tokenToConsume, expected);
        if (error) {
          throw error;
        }
      }
    }

    this.fillQueue(2);

    if (this._queue[0] === Token.nullToken) {
      this._eof = true;
    }

    return tokenToConsume;
  }

  private checkIsExpected(tokenToConsume: Token, expected: any): Error {
    if (Array.isArray(expected)) {
      var isExpected: boolean = false;
      for (var i = 0; i < expected.length; ++i) {
        if (tokenToConsume.text === expected[i]) {
          isExpected = true;
          break;
        }
      }
      if (!isExpected) {
        return new Error('expected one of ' + expected + ' but found ' + tokenToConsume.text + ' at ' + tokenToConsume.pointer);
      }
    } else if (typeof expected === 'number') {
      if (!tokenToConsume.is(<TokenType>expected)) {
        return new Error('expected ' + TokenType[expected] + ' but found ' + tokenToConsume.text + ' at ' + tokenToConsume.pointer);
      }
    } else {
      if (tokenToConsume.text !== expected) {
        return new Error('expected ' + expected + ' but found ' + tokenToConsume.text + ' at ' + tokenToConsume.pointer);
      }
    }
  }

  private fillQueue(size: number): void {
    while (this._queue.length < size) {
      var readResult = TokenIterator.readToken(this._original, this._nextPointer);
      this._queue.push(readResult.token);
      this._nextPointer = readResult.nextPointer;
    }
  }

  private static readToken(razor: string, pointer: Pointer): ITokenReadResult {
    var currentTokenChars: string,
      tokenPointer: Pointer,
      nextPointer: Pointer,
      thisChar: string,
      nextChar: string,
      type: TokenType;

    if (pointer.index >= razor.length) {
      return { token: Token.nullToken, nextPointer: pointer };
    }

    tokenPointer = pointer.clone();
    nextPointer = tokenPointer.clone();

    thisChar = razor[tokenPointer.index];
    currentTokenChars = thisChar;

    if (thisChar === '\n') {
      nextPointer.nextLine();
    } else {
      nextPointer.next();
    }


    if (nextPointer.index < razor.length) {
      nextChar = razor[nextPointer.index];
    }

    var continueReadingToken = (condition: () => boolean) => {
      while (nextChar && condition()) {
        currentTokenChars = currentTokenChars.concat(nextChar);
        if (nextChar === '\n') {
          nextPointer.nextLine();
        } else {
          nextPointer.next();
        }
        nextChar = razor[nextPointer.index];
      }
    };

    if (TokenIterator.isAlpha(thisChar)) {
      continueReadingToken(() => TokenIterator.isAlphanumeric(nextChar));
      type = TokenType.alphanumeric;
    } else if (TokenIterator.isDigit(thisChar) || (thisChar === '.' && TokenIterator.isDigit(nextChar))) {
      continueReadingToken(() => TokenIterator.isDigit(nextChar) || (nextChar === '.' && currentTokenChars.indexOf('.') === -1));
      type = TokenType.numeric;
    } else if (TokenIterator.isRazorDelimiter(thisChar)) {
      type = TokenType.razor;
    } else if (TokenIterator.isOperator(thisChar)) {
      continueReadingToken(() => TokenIterator.isOperator(thisChar + nextChar));
      type = TokenType.operator;
    } else if (TokenIterator.isWhiteSpace(thisChar)) {
      continueReadingToken(() => TokenIterator.isWhiteSpace(nextChar));
      type = TokenType.whitespace;
    } else if (true) {
      continueReadingToken(() => thisChar !== currentTokenChars[0]);
      type = TokenType.undefined;
    } else {
      throw new Error('unrecognised character at ' + pointer + ': ' + thisChar);
    }

    return {
      token: new Token(tokenPointer, currentTokenChars, type),
      nextPointer: nextPointer
    };
  }

  private static isDigit(c: string): boolean {
    return !isNaN(parseInt(c));
  }

  private static isAlphanumeric(c: string): boolean {
    return TokenIterator.isAlpha(c) || TokenIterator.isDigit(c) || c === '_';
  }

  private static isAlpha(c: string): boolean {
    var cc = c.charCodeAt(0);
    return (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122);
  }

  private static isWhiteSpace(c: string): boolean {
    return c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\r';
  }

  private static isRazorDelimiter(c: string): boolean {
    return c === '@';
  }

  private static isOperator(c: string): boolean {
    return TokenIterator.operators.hasOwnProperty(c);
  }

  private static operators = arrayToHash([
    '+', '-',
    '++', '--',
    '*', '/', '%',
    '(', ')', '{', '}', ',',
    '?', ':', '.',
    '&', '^', '|', '~', '<<', '>>', '>>>',
    '<', '>', '<=', '>=',
    '!', '!=', '==', '!==', '===', '!==',
    '&&', '||',
    '=', '+=', '-=', '*=', '/=', '%=',
    '<<=', '>>=', '>>>=', '&=', '^=', '|=',
    '"', "'",
    '[', ']',
    ';',
  ]);
}

function arrayToHash(arr: Array<string>): { [key: string]: boolean } {
  var i,
    hash: { [key: string]: boolean } = {};
  for (i = 0; i < arr.length; ++i) {
    hash[arr[i]] = true;
  }
  return hash;
}

interface ITokenReadResult {
  token: Token;
  nextPointer: Pointer;
}


export = TokenIterator;
