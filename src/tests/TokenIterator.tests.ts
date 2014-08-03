import TokenIterator = require('../tokens/TokenIterator');
import Token = require('../tokens/Token');
import TokenType = require('../tokens/TokenType');

QUnit.module('TokenIterator');

test('reports correct column', function() {
  var it = new TokenIterator('a b');
  it.consume('a');
  var pointer = it.nowhitespace.consume('b').pointer;

  equal(pointer.column, 2);
});

test('reports correct column across multi-character tokens', function() {
  var it = new TokenIterator('ab c');
  it.consume('ab');
  var pointer = it.nowhitespace.consume('c').pointer;

  equal(pointer.column, 3);
});

test('reports correct line numbers', function() {
  var it = new TokenIterator('a\nb');
  it.consume('a');
  var pointer = it.nowhitespace.consume('b').pointer;

  equal(pointer.line, 1);
});

test('reports correct column after new line', function() {
  var it = new TokenIterator('a\nb');
  it.consume('a');
  var pointer = it.nowhitespace.consume('b').pointer;

  equal(pointer.column, 0);
});

test('reports correct line and column after new line followed by whitespace', function() {
  var it = new TokenIterator('a\n b');
  it.consume('a');
  var pointer = it.nowhitespace.consume('b').pointer;

  equal(pointer.line, 1);
  equal(pointer.column, 1);
});

test('simple html token test', function () {
    var input = '<div></div>',
        it = new TokenIterator(input);

    var output: Array<Token> = [];
    while (!it.eof) {
        output.push(it.consume());
    }

    equal(output[0].text, '<');
    equal(output[1].text, 'div');
    equal(output[2].text, '>');
    equal(output[3].text, '<');
    equal(output[4].text, '/');
    equal(output[5].text, 'div');
    equal(output[6].text, '>');
});

test('simple html token test with razor model access in class attribute', function () {
    var input = '<div class="@model.test"></div>',
        it = new TokenIterator(input);

    var output: Array<Token> = [];
    while (!it.eof) {
        output.push(it.consume());
    }

    var i = 0,
        eq = function (s) {
            equal(output[i++].text, s);
        };

    eq('<');
    eq('div');
    eq(' ');
    eq('class');
    eq('=');
    eq('"');
    eq('@');
    eq('model');
    eq('.');
    eq('test');
    eq('"');
    eq('>');
    eq('<');
    eq('/');
    eq('div');
    eq('>');
});

test('eof', function () {
    var it = new TokenIterator('a b');

    equal(it.eof, false);
    it.consume();
    equal(it.eof, false);
    it.consume();
    equal(it.eof, false);
    it.consume();
    equal(it.eof, true);
});

test('consume', function () {
    var it = new TokenIterator('a b');

    equal(it.consume().text, 'a');
    equal(it.consume().text, ' ');
    equal(it.consume().text, 'b');
});

test('consume non-whitespace', function () {
    var it = new TokenIterator('a b');

    equal(it.nowhitespace.consume().text, 'a');
    equal(it.nowhitespace.consume().text, 'b');
});

test('consume non-whitespace with linebreak', function () {
    var it = new TokenIterator('a \n b');

    equal(it.nowhitespace.consume().text, 'a');
    equal(it.nowhitespace.consume().text, 'b');
});

test('is whitespace', function () {
    var it = new TokenIterator(' ');

    equal(it.consume().isWhitespace, true);
});

test('peek', function () {
    var it = new TokenIterator('a b');

    equal(it.peek.text, 'a');
    it.consume();
    equal(it.peek.text, ' ');
    it.consume();
    equal(it.peek.text, 'b');
});

test('peek next', function () {
    var it = new TokenIterator('a b');

    equal(it.peekNext.text, ' ');
    it.consume();
    equal(it.peekNext.text, 'b');
    it.consume();
    equal(it.peekNext, Token.nullToken);
});

test('peek non-whitespace', function () {
    var it = new TokenIterator('a b');

    it.consume();
    equal(it.peek.text, ' ');
    equal(it.nowhitespace.peek.text, 'b');
    equal(it.peek.text, ' ');
    it.consume();
    equal(it.peek.text, 'b');
    equal(it.nowhitespace.peek.text, 'b');
});

test('peek non-whitespace with linebreak', function () {
    var it = new TokenIterator('a \n b');

    it.consume();
    equal(it.peek.text, ' \n ');
    equal(it.nowhitespace.peek.text, 'b');
    equal(it.peek.text, ' \n ');
    it.consume();
    equal(it.peek.text, 'b');
    equal(it.nowhitespace.peek.text, 'b');
});

test('peek next non-whitespace', function () {
    var it = new TokenIterator('a b');

    equal(it.nowhitespace.peekNext.text, 'b');
    it.consume();
    equal(it.nowhitespace.peekNext, Token.nullToken);
});

test('peek next non-whitespace with linebreak', function () {
    var it = new TokenIterator('a \n b');

    equal(it.nowhitespace.peekNext.text, 'b');
    it.consume();
    equal(it.nowhitespace.peekNext, Token.nullToken);
});

test('consume specific token value correctly', function(){
  var it = new TokenIterator('a');
  var token = it.consume('a');
  equal(token.text, 'a');
});

test('consume specific token value incorrectly', function(){
  var it = new TokenIterator('a');
  throws(() => it.consume('b'), 'consuming incorrect token should throw');
});

test('consume one of set of specific token values correctly', function(){
  var it = new TokenIterator('b');
  var token = it.consume(['a', 'b']);
  equal(token.text, 'b');
});

test('consume one of set of specific token values incorrectly', function(){
  var it = new TokenIterator('a');
  throws(() => it.consume(['b', 'c']), 'consuming incorrect token types should throw');
});

test('consume specific token type correctly', function(){
  var it = new TokenIterator('a');
  var token = it.consume(TokenType.alphanumeric);
  equal(token.text, 'a');
});

test('consume specific token type incorrectly', function(){
  var it = new TokenIterator('a');
  throws(() => it.consume(TokenType.operator), 'consuming incorrect token type should throw');
});

test('tokenises ++ correctly', function(){
  var it = new TokenIterator('++');
  var token = it.consume(TokenType.operator);
  equal(token.text, '++');
});
