import { ConditionConfiguration, ConditionCriterion, CriterionOperation } from '../models/condition-models';
import { evaluateCondition, evaluateConditionSet, evaluateCriterion } from './condition-evaluator';

function criterion(overrides: Partial<ConditionCriterion> = {}): ConditionCriterion {
  return {
    id: 'c1',
    telemetryKeyString: 'pwr.bus_v',
    metadataKey: 'value',
    operation: 'greaterThan',
    input: [10],
    ...overrides,
  };
}

function condition(overrides: Partial<ConditionConfiguration> = {}): ConditionConfiguration {
  return { id: 'k1', name: 'K1', trigger: 'all', criteria: [criterion()], output: 'ON', ...overrides };
}

describe('OMCT-C10-L2-01.02 Criteria operators', () => {
  const cases: [CriterionOperation, (string | number)[], number, boolean][] = [
    ['equalTo', [12], 12, true],
    ['equalTo', [12], 11, false],
    ['notEqualTo', [12], 11, true],
    ['greaterThan', [10], 11, true],
    ['greaterThan', [10], 10, false],
    ['lessThan', [10], 9, true],
    ['greaterThanOrEqualTo', [10], 10, true],
    ['lessThanOrEqualTo', [10], 10, true],
    ['between', [10, 20], 15, true],
    ['between', [10, 20], 25, false],
    ['outsideOf', [10, 20], 25, true],
    ['outsideOf', [10, 20], 15, false],
  ];

  it.each(cases)('produces the boolean result of %s %p against %p', (operation, input, value, expected) => {
    expect(evaluateCriterion(criterion({ operation, input }), { value })).toBe(expected);
  });

  it('applies string operations', () => {
    expect(evaluateCriterion(criterion({ operation: 'contains', input: ['SAFE'] }), { value: 'SAFE_MODE' })).toBe(true);
    expect(
      evaluateCriterion(criterion({ operation: 'doesNotContain', input: ['SAFE'] }), { value: 'NOMINAL' }),
    ).toBe(true);
  });

  it('does not match a value-based operation when no datum has arrived', () => {
    expect(evaluateCriterion(criterion({ operation: 'greaterThan', input: [10] }), { value: undefined })).toBe(false);
  });

  it('resolves the old-data operation from the stale flag', () => {
    expect(evaluateCriterion(criterion({ operation: 'isOlderThan', input: [1000] }), { value: 5, stale: true })).toBe(
      true,
    );
    expect(evaluateCriterion(criterion({ operation: 'isOlderThan', input: [1000] }), { value: 5, stale: false })).toBe(
      false,
    );
  });
});

describe('OMCT-C10-L2-01.03 Any and all triggers', () => {
  const a = criterion({ id: 'a', operation: 'greaterThan', input: [10] });
  const b = criterion({ id: 'b', operation: 'lessThan', input: [5] });

  it('selects true under ALL only when every criterion matches', () => {
    const cond = condition({ trigger: 'all', criteria: [a, b] });
    expect(evaluateCondition(cond, (c) => (c.id === 'a' ? true : true))).toBe(true);
    expect(evaluateCondition(cond, (c) => c.id === 'a')).toBe(false);
  });

  it('selects true under ANY when at least one criterion matches', () => {
    const cond = condition({ trigger: 'any', criteria: [a, b] });
    expect(evaluateCondition(cond, (c) => c.id === 'a')).toBe(true);
    expect(evaluateCondition(cond, () => false)).toBe(false);
  });

  it('never matches a non-default condition with no criteria', () => {
    expect(evaluateCondition(condition({ criteria: [] }), () => true)).toBe(false);
  });
});

describe('OMCT-C10-L2-01.04 Ordered first match', () => {
  const first = condition({ id: 'first', output: 'FIRST' });
  const second = condition({ id: 'second', output: 'SECOND' });
  const fallback = condition({ id: 'default', output: 'DEFAULT', isDefault: true, criteria: [] });

  it('publishes the output of the first matching condition in order', () => {
    const matched = evaluateConditionSet([first, second, fallback], () => true);
    expect(matched?.id).toBe('first');
    expect(matched?.output).toBe('FIRST');
  });

  it('falls back to the default condition when none match', () => {
    const matched = evaluateConditionSet([first, second, fallback], () => false);
    expect(matched?.id).toBe('default');
    expect(matched?.output).toBe('DEFAULT');
  });
});
