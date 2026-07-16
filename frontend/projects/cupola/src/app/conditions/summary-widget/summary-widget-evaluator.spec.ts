import { SummaryRule, ValueResolver, evaluateSummaryRules } from './summary-widget-evaluator';

function rule(overrides: Partial<SummaryRule>): SummaryRule {
  return {
    id: 'r',
    name: 'Rule',
    scope: 'single',
    telemetryKeyString: 'a',
    metadataKey: 'value',
    operation: 'greaterThan',
    input: [10],
    ...overrides,
  };
}

const fallback = rule({ id: 'default', name: 'Default', isDefault: true, label: 'OK' });

function resolverFrom(values: Record<string, number>): ValueResolver {
  return (keyString) => values[keyString];
}

describe('OMCT-C10-L2-02.03 Summary-widget rules', () => {
  it('selects the first matching rule in order', () => {
    const rules = [
      rule({ id: 'critical', input: [90], label: 'CRIT' }),
      rule({ id: 'caution', input: [50], label: 'CAUTION' }),
      fallback,
    ];

    const selected = evaluateSummaryRules(rules, ['a'], resolverFrom({ a: 60 }));

    expect(selected?.id).toBe('caution');
    expect(selected?.label).toBe('CAUTION');
  });

  it('falls back to the default rule when none match', () => {
    const rules = [rule({ id: 'critical', input: [90] }), fallback];
    expect(evaluateSummaryRules(rules, ['a'], resolverFrom({ a: 10 }))?.id).toBe('default');
  });
});

describe('OMCT-C10-L2-02.04 Summary-widget aggregate conditions', () => {
  const resolve = resolverFrom({ a: 5, b: 15, c: 25 });

  it('matches a single configured object', () => {
    const rules = [rule({ id: 'r1', scope: 'single', telemetryKeyString: 'b', input: [10] }), fallback];
    expect(evaluateSummaryRules(rules, ['a', 'b', 'c'], resolve)?.id).toBe('r1');
  });

  it('matches when any composed object satisfies the rule', () => {
    const rules = [rule({ id: 'r1', scope: 'any', input: [20] }), fallback];
    expect(evaluateSummaryRules(rules, ['a', 'b', 'c'], resolve)?.id).toBe('r1');
  });

  it('matches only when all composed objects satisfy the rule', () => {
    const rulesAllPass = [rule({ id: 'r1', scope: 'all', input: [0] }), fallback];
    expect(evaluateSummaryRules(rulesAllPass, ['a', 'b', 'c'], resolve)?.id).toBe('r1');

    const rulesOneFails = [rule({ id: 'r1', scope: 'all', input: [10] }), fallback];
    expect(evaluateSummaryRules(rulesOneFails, ['a', 'b', 'c'], resolve)?.id).toBe('default');
  });
});
