import TokenIterator = require('../tokens/TokenIterator');
import Parser = require('../parser/Parser');
import Segment = require('../segments/Segment');
import HtmlSegment = require('../segments/Html');
import LiteralSegment = require('../segments/Literal');
import RazorBlockSegment = require('../segments/RazorBlock');
import RazorVariableAccess = require('../segments/RazorVariableAccess');
import RazorMethodCall = require('../segments/RazorMethodCall');
import RazorArrayAccess = require('../segments/RazorArrayAccess');
import RazorLiteral = require('../segments/RazorLiteral');
import RazorStatement = require('../segments/RazorStatement');
import RazorIfStatement = require('../segments/RazorIfStatement');
import RazorVariableAssignment = require('../segments/RazorVariableAssignment');
import RazorBinaryExpression = require('../segments/RazorBinaryExpression');
import RazorUnaryExpression = require('../segments/RazorUnaryExpression');
import RazorForLoop = require('../segments/RazorForLoop');

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
  var input = '@{ var x = 42; }',
      it = new TokenIterator(input),
      parser = new Parser(it),
      output: Array<Segment>;

  output = parser.parse();

  var razorBlockSegment = <RazorBlockSegment>output[0];
  equal(razorBlockSegment.statements.length, 1);
  ok(razorBlockSegment.statements[0] instanceof RazorVariableAssignment, 'expected RazorVariableAssignment');
  var assignment = <RazorVariableAssignment>razorBlockSegment.statements[0];

  equal(assignment.variable.name, 'x');
  equal(assignment.variable.object, null);

  ok(assignment.expression instanceof RazorLiteral, 'expected expression to be RazorLiteral');
  equal((<RazorLiteral>assignment.expression).expression, '42');
});

test('razor block with binary statement', function(){
  debugger;
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

  ok(forLoop.initialisation instanceof RazorVariableAssignment, 'expected loop initialisation to be RazorVariableAssignment');
  var init = <RazorVariableAssignment>forLoop.initialisation;
  equal(init.variable.name, 'i');
  equal((<RazorLiteral>init.expression).expression, '0');

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
