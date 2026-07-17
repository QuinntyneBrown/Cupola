import { DomainObject } from '@cupola/core';

import { ConditionSetCompositionPolicy } from './condition-set-composition-policy';

function object(overrides: Partial<DomainObject>): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'k',
    type: 'folder',
    location: null,
    composition: [],
    ...overrides,
  };
}

describe('OMCT-C10-L2-01.01 Condition-set composition', () => {
  const policy = new ConditionSetCompositionPolicy();
  const conditionSet = object({ keyString: 'cs', type: 'condition-set' });

  it('allows a telemetry-producing child', () => {
    const telemetry = object({ keyString: 't', type: 'telemetry', telemetry: { hints: ['range'] } });
    expect(policy.allow(conditionSet, telemetry)).toBe(true);
  });

  it('allows a derived-telemetry child', () => {
    expect(policy.allow(conditionSet, object({ keyString: 'd', type: 'derived-telemetry' }))).toBe(true);
  });

  it('rejects a non-telemetry child', () => {
    expect(policy.allow(conditionSet, object({ keyString: 'f', type: 'folder' }))).toBe(false);
    expect(policy.allow(conditionSet, object({ keyString: 'p', type: 'overlay-plot' }))).toBe(false);
  });

  it('does not constrain other parent types', () => {
    const folder = object({ keyString: 'parent', type: 'folder' });
    expect(policy.allow(folder, object({ keyString: 'f2', type: 'folder' }))).toBe(true);
  });
});
