import TokenIterator = require('../tokens/TokenIterator');
import Parser = require('../parser/Parser');
import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import LiteralSegment = require('../segments/Literal');
import RazorInlineExpression = require('../segments/RazorInlineExpression');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorArrayLiteral = require('../segments/RazorArrayLiteral');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorVariableDeclaration = require('../segments/RazorVariableDeclaration');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorForLoop = require('../segments/RazorForLoop');
import RazorForEachLoop = require('../segments/RazorForEachLoop');
import RazorComment = require('../segments/RazorComment');
import RazorSection = require('../segments/RazorSection');

QUnit.module('Parser');

test('empty razor block', function(){
  var input = '@{ }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  equal(output.length, 1);
  ok(output[0] instanceof RazorBlockSegment, 'expected RazorBlockSegment');

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 0);
});

test('razor block with single html element', function(){
  var input = '@{ <div /> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof HtmlSegment, 'expected HtmlSegment');
});

test('razor block with variable assignment', function(){
  var input = '@{ x = 42; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorBinaryExpression, 'expected RazorBinaryExpression');
  var assignment = <RazorBinaryExpression>razorBlockSegment.statements[0];

  equal((<RazorVariableAccess>assignment.leftOperand).name, 'x');

  ok(assignment.rightOperand instanceof RazorLiteral, 'expected expression to be RazorLiteral');
  equal((<RazorLiteral>assignment.rightOperand).expression, '42');
});

test('razor block with variable declaration', function() {
  var input = '@{ var x; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorVariableDeclaration, 'expected RazorVariableDeclaration');
  var declaration = <RazorVariableDeclaration>razorBlockSegment.statements[0];

  equal(declaration.name, 'x');
});

test('razor block with variable declaration and initialisation', function() {
  var input = '@{ var x = 42; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorVariableDeclaration, 'expected RazorVariableDeclaration');
  var declaration = <RazorVariableDeclaration>razorBlockSegment.statements[0];

  equal(declaration.name, 'x');

  ok(declaration.initialiser instanceof RazorLiteral, 'expected initialiser to be RazorLiteral');
  equal((<RazorLiteral>declaration.initialiser).expression, '42');
});

test('razor block with binary statement', function(){
  var input = '@{ 1 < 2; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorBinaryExpression, 'expected RazorBinaryExpression but got ' + razorBlockSegment.statements[0].getType());
  var binary = <RazorBinaryExpression>razorBlockSegment.statements[0];
  equal(binary.operator, '<');
  ok(binary.leftOperand instanceof RazorLiteral, 'expected leftOperand to be RazorLiteral but was ' + binary.leftOperand.getType());
  ok(binary.rightOperand instanceof RazorLiteral, 'expected rightOperand to be RazorLiteral but was ' + binary.rightOperand.getType());
  var left = <RazorLiteral>binary.leftOperand;
  equal(left.expression, '1');
  var right = <RazorLiteral>binary.rightOperand;
  equal(right.expression, '2');
});

test('razor block with new operator', function(){
  var input = '@{ new Array(); }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorUnaryExpression, 'expected RazorUnaryExpression but got ' + razorBlockSegment.statements[0].getType());

  var unary = <RazorUnaryExpression>razorBlockSegment.statements[0];
  equal(unary.operator, 'new');
  ok(unary.operand instanceof RazorMethodCall, 'expected RazorMethodCall but got ' + unary.operand.getType());

  var methodCall = <RazorMethodCall>unary.operand;
  ok(methodCall.accessor instanceof RazorVariableAccess, 'expected RazorVariableAccess but got ' + methodCall.accessor.getType());
  var variableAccess = <RazorVariableAccess>methodCall.accessor;
  equal(variableAccess.name, 'Array');

  equal(methodCall.arguments.length, 0);

});

test('razor block with variable declaration and initialisation with new operator', function() {
  var input = '@{ var x = new Array(); }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorVariableDeclaration, 'expected RazorVariableDeclaration');
  var declaration = <RazorVariableDeclaration>razorBlockSegment.statements[0];

  equal(declaration.name, 'x');

  ok(declaration.initialiser instanceof RazorUnaryExpression, 'expected initialiser to be RazorUnaryExpression');
  
  var unary = <RazorUnaryExpression>declaration.initialiser;
  equal(unary.operator, 'new');
  ok(unary.operand instanceof RazorMethodCall, 'expected RazorMethodCall but got ' + unary.operand.getType());

  var methodCall = <RazorMethodCall>unary.operand;
  ok(methodCall.accessor instanceof RazorVariableAccess, 'expected RazorVariableAccess but got ' + methodCall.accessor.getType());
  var variableAccess = <RazorVariableAccess>methodCall.accessor;
  equal(variableAccess.name, 'Array');

  equal(methodCall.arguments.length, 0);
});

test('razor block with array literal', function(){
  var input = '@{ ["b", "c"]; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorArrayLiteral, 'expected RazorArrayLiteral but got ' + razorBlockSegment.statements[0].getType());

  var arrayLiteral = <RazorArrayLiteral>razorBlockSegment.statements[0];

  equal(arrayLiteral.elements.length, 2);
  
  ok(arrayLiteral.elements[0] instanceof RazorLiteral, 'expected RazorLiteral but got ' + arrayLiteral.elements[0].getType());
  ok(arrayLiteral.elements[1] instanceof RazorLiteral, 'expected RazorLiteral but got ' + arrayLiteral.elements[0].getType());
});

test('html inside razor block', function(){
  var input = '@if (true) { <div /> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorIfStatement, 'expected RazorIfStatement');
  var ifStatement = <RazorIfStatement>output[0];

  ok(ifStatement.test instanceof RazorLiteral, 'expected test to be RazorLiteral');
  equal((<RazorLiteral>ifStatement.test).expression, 'true');

  equal(ifStatement.body.statements.length, 1);
  ok(ifStatement.body.statements[0] instanceof HtmlSegment, 'expected body to contain Html');
});

test('empty for loop razor expression', function(){
  var input = '@for(var i = 0; i < 2; ++i) { }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorForLoop, 'expected RazorForLoop');
  var forLoop = <RazorForLoop>output[0];

  ok(forLoop.initialisation instanceof RazorVariableDeclaration, 'expected loop initialisation to be RazorVariableDeclaration');
  var init = <RazorVariableDeclaration>forLoop.initialisation;
  equal(init.name, 'i');
  equal((<RazorLiteral>init.initialiser).expression, '0');

  ok(forLoop.condition instanceof RazorBinaryExpression, 'expected loop condition to be RazorBinaryExpression');
  var condition = <RazorBinaryExpression>forLoop.condition;
  ok(condition.leftOperand instanceof RazorVariableAccess, 'expected leftOperand of condition to be RazorVariableAccess');
  equal((<RazorVariableAccess>condition.leftOperand).name, 'i');
  ok(condition.rightOperand instanceof RazorLiteral, 'expected rightOperand of condition to be RazorLiteral');
  equal((<RazorLiteral>condition.rightOperand).expression, '2');
  equal(condition.operator, '<');

  ok(forLoop.iteration instanceof RazorUnaryExpression, 'expected loop iteration to be RazorUnaryExpression');
  var iteration = <RazorUnaryExpression>forLoop.iteration;
  equal(iteration.operator, '++');
  ok(iteration.operand instanceof RazorVariableAccess, 'expected loop iteration operand to be RazorVariableAccess');
  equal((<RazorVariableAccess>iteration.operand).name, 'i');
});

test('empty foreach razor expression over variable', function() {
  var input = '@foreach(var abc in def){}',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorForEachLoop, 'expected RazorForEachLoop');
  var forEachLoop = <RazorForEachLoop>output[0];

  equal(forEachLoop.loopVariable, 'abc');

  ok(forEachLoop.collection instanceof RazorVariableAccess, 'expected collection to be RazorVariableAccess');
  var collection = <RazorVariableAccess>forEachLoop.collection;
  equal(collection.name, 'def');
  equal(collection.object, null);
});

test('razor comments are parsed', function() {
  var commentText = 'this <b>is</b> @foreach(comment in this) {} a return 0; comment',
      input = '@*' + commentText + '*@',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  equal(output.length, 1);
  ok(output[0] instanceof RazorComment, 'expected a RazorComment');
  var comment = <RazorComment>output[0];
  equal(comment.text, commentText);
});

test('named razor section with content', function() {
  var input = '@section abc { <hr /> }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  ok(output[0] instanceof RazorSection);
  var helper = <RazorSection>output[0];
  equal(helper.name, 'abc');
  equal(helper.block.statements.length, 1);
});

test('if statements with comparison', function() {
  var input = '@if (true != false) { }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var condition = (<RazorIfStatement>output[0]).test;
  ok(condition instanceof RazorBinaryExpression);
  var binary = <RazorBinaryExpression>condition;
  ok(binary.leftOperand instanceof RazorLiteral);
  equal((<RazorLiteral>binary.leftOperand).expression, 'true');
  equal(binary.operator, '!=');
  ok(binary.rightOperand instanceof RazorLiteral);
  equal((<RazorLiteral>binary.rightOperand).expression, 'false');
});

test('html with simple razor expression', function() {
  var input = '<a>@b @c</a>',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var a = <HtmlSegment>output[0];
  equal(a.children.length, 2);

  var b = <RazorInlineExpression>a.children[0];
  equal(b.leadingWhitespace, '')

  var c = <RazorInlineExpression>a.children[1];
  equal(c.leadingWhitespace, ' ');
});
