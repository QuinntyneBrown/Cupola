import { DomainObject } from '@cupola/core';

import { TimeListCompositionPolicy } from './time-list-composition-policy';

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

describe('OMCT-C12-L2-03.01 Plan loading', () => {
  const timeList = object({ keyString: 'tl', type: 'time-list' });
  const policy = new TimeListCompositionPolicy();

  it('allows an eligible plan into the time list', () => {
    expect(policy.allow(timeList, object({ type: 'plan' }))).toBe(true);
  });

  it('rejects a non-plan child', () => {
    expect(policy.allow(timeList, object({ type: 'telemetry' }))).toBe(false);
    expect(policy.allow(timeList, object({ type: 'folder' }))).toBe(false);
  });

  it('does not constrain other parents', () => {
    expect(policy.allow(object({ type: 'folder' }), object({ type: 'plan' }))).toBe(true);
  });
});
