import { compileExpression } from './expression';

describe('safe expression evaluator', () => {
  it('evaluates arithmetic with correct precedence and associativity', () => {
    expect(compileExpression('1 + 2 * 3').evaluate({})).toBe(7);
    expect(compileExpression('(1 + 2) * 3').evaluate({})).toBe(9);
    expect(compileExpression('2 ^ 3 ^ 2').evaluate({})).toBe(512);
    expect(compileExpression('10 / 2 / 5').evaluate({})).toBe(1);
  });

  it('applies unary minus', () => {
    expect(compileExpression('-5 + 2').evaluate({})).toBe(-3);
    expect(compileExpression('3 * -2').evaluate({})).toBe(-6);
    expect(compileExpression('-(2 + 3)').evaluate({})).toBe(-5);
  });

  it('resolves named source identifiers from the scope', () => {
    const compiled = compileExpression('a * b + c');
    expect(compiled.identifiers.sort()).toEqual(['a', 'b', 'c']);
    expect(compiled.evaluate({ a: 2, b: 3, c: 4 })).toBe(10);
  });

  it('throws for a missing source value rather than coercing', () => {
    expect(() => compileExpression('a + 1').evaluate({})).toThrow(/Missing value/);
  });

  it('rejects malformed input without evaluating code', () => {
    expect(() => compileExpression('1 + (2').evaluate({})).toThrow(/parentheses/);
    expect(() => compileExpression('alert(1)`').evaluate({})).toThrow();
  });
});
