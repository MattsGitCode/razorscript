import TokenType = require('./TokenType');
import Token = require('./Token');

interface ITokenIterator {
  eof: boolean;
  peek: Token;
  peekNext: Token;
  consume(expected: string): Token;
  consume(expected: Array<string>): Token;
  consume(expected: TokenType): Token;
  consume(): Token;
  nowhitespace: ITokenIterator;
}

export = ITokenIterator;
