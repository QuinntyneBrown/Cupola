import { DomainObject } from '@cupola/core';

import { GanttCompositionPolicy } from './gantt-composition-policy';

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

describe('OMCT-C12-L2-01.05 Gantt chart composition', () => {
  const gantt = object({ keyString: 'g', type: 'gantt-chart' });
  const policy = new GanttCompositionPolicy();

  it('allows a plan as a gantt child', () => {
    expect(policy.allow(gantt, object({ type: 'plan' }))).toBe(true);
  });

  it('rejects a non-plan gantt child', () => {
    expect(policy.allow(gantt, object({ type: 'telemetry' }))).toBe(false);
    expect(policy.allow(gantt, object({ type: 'folder' }))).toBe(false);
    expect(policy.allow(gantt, object({ type: 'overlay-plot' }))).toBe(false);
  });

  it('does not constrain other parents', () => {
    expect(policy.allow(object({ type: 'folder' }), object({ type: 'telemetry' }))).toBe(true);
  });
});
