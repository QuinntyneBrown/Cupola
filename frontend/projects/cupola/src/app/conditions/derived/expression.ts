/**
 * A safe arithmetic expression evaluator for derived telemetry
 * (OMCT-C10-L2-03.01). Supports `+ - * / ^`, parentheses, unary minus, numeric
 * literals, and named source identifiers, compiled via tokenizer and
 * shunting-yard to reverse-polish notation. It never uses `eval` or `Function`.
 */

type TokenType = 'number' | 'identifier' | 'operator' | 'lparen' | 'rparen';

interface Token {
  type: TokenType;
  value: string;
}

interface OperatorInfo {
  precedence: number;
  rightAssociative: boolean;
}

const OPERATORS: Record<string, OperatorInfo> = {
  '+': { precedence: 2, rightAssociative: false },
  '-': { precedence: 2, rightAssociative: false },
  '*': { precedence: 3, rightAssociative: false },
  '/': { precedence: 3, rightAssociative: false },
  '^': { precedence: 4, rightAssociative: true },
};

const UNARY_NEGATE = 'neg';

export function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < expression.length) {
    const char = expression[index];
    if (char === ' ' || char === '\t' || char === '\n') {
      index += 1;
      continue;
    }
    if (char >= '0' && char <= '9') {
      let number = '';
      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        number += expression[index];
        index += 1;
      }
      tokens.push({ type: 'number', value: number });
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      let identifier = '';
      while (index < expression.length && /[A-Za-z0-9_]/.test(expression[index])) {
        identifier += expression[index];
        index += 1;
      }
      tokens.push({ type: 'identifier', value: identifier });
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'lparen', value: char });
      index += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: char });
      index += 1;
      continue;
    }
    if (char in OPERATORS) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }
    throw new Error(`Unexpected character '${char}' in expression`);
  }
  return tokens;
}

/** Converts an infix token list to reverse-polish notation. */
function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  let previous: Token | undefined;

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'identifier') {
      output.push(token);
    } else if (token.type === 'operator') {
      const isUnaryMinus =
        token.value === '-' &&
        (previous === undefined || previous.type === 'operator' || previous.type === 'lparen');
      if (isUnaryMinus) {
        stack.push({ type: 'operator', value: UNARY_NEGATE });
      } else {
        const info = OPERATORS[token.value];
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type !== 'operator') {
            break;
          }
          const topInfo = top.value === UNARY_NEGATE ? { precedence: 5, rightAssociative: true } : OPERATORS[top.value];
          const higher = topInfo.precedence > info.precedence;
          const equalLeft = topInfo.precedence === info.precedence && !info.rightAssociative;
          if (higher || equalLeft) {
            output.push(stack.pop() as Token);
          } else {
            break;
          }
        }
        stack.push(token);
      }
    } else if (token.type === 'lparen') {
      stack.push(token);
    } else if (token.type === 'rparen') {
      while (stack.length && stack[stack.length - 1].type !== 'lparen') {
        output.push(stack.pop() as Token);
      }
      if (!stack.length) {
        throw new Error('Mismatched parentheses in expression');
      }
      stack.pop();
    }
    previous = token;
  }

  while (stack.length) {
    const top = stack.pop() as Token;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Mismatched parentheses in expression');
    }
    output.push(top);
  }
  return output;
}

/** A compiled expression evaluated against a scope of named source values. */
export interface CompiledExpression {
  /** Source identifiers referenced by the expression. */
  readonly identifiers: string[];
  /** Evaluates the expression; throws when a referenced identifier is absent. */
  evaluate(scope: Record<string, number>): number;
}

export function compileExpression(expression: string): CompiledExpression {
  const rpn = toRpn(tokenize(expression));
  const identifiers = [...new Set(rpn.filter((token) => token.type === 'identifier').map((token) => token.value))];

  return {
    identifiers,
    evaluate(scope: Record<string, number>): number {
      const stack: number[] = [];
      for (const token of rpn) {
        if (token.type === 'number') {
          stack.push(Number(token.value));
        } else if (token.type === 'identifier') {
          const value = scope[token.value];
          if (typeof value !== 'number' || Number.isNaN(value)) {
            throw new Error(`Missing value for source '${token.value}'`);
          }
          stack.push(value);
        } else if (token.value === UNARY_NEGATE) {
          stack.push(-(stack.pop() as number));
        } else {
          const right = stack.pop() as number;
          const left = stack.pop() as number;
          stack.push(applyOperator(token.value, left, right));
        }
      }
      if (stack.length !== 1) {
        throw new Error('Malformed expression');
      }
      return stack[0];
    },
  };
}

function applyOperator(operator: string, left: number, right: number): number {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    case '^':
      return left ** right;
    default:
      throw new Error(`Unknown operator '${operator}'`);
  }
}
