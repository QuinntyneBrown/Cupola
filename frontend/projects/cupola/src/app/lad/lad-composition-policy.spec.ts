import { DomainObject } from '@cupola/core';

import { LadCompositionPolicy, producesTelemetry } from './lad-composition-policy';

function object(type: string, telemetry: DomainObject['telemetry'] = null): DomainObject {
  return {
    identifier: { namespace: '', key: type },
    keyString: type,
    name: type,
    type,
    location: null,
    composition: [],
    telemetry,
  };
}

const ladTable = object('lad-table');

describe('OMCT-C08-L2-02.01 LAD table composition', () => {
  const policy = new LadCompositionPolicy();

  it('allows a telemetry-producing child in a LAD table', () => {
    expect(policy.allow(ladTable, object('telemetry', { hints: ['range'] }))).toBe(true);
    expect(policy.allow(ladTable, object('derived-telemetry'))).toBe(true);
  });

  it('rejects a non-telemetry child in a LAD table', () => {
    expect(policy.allow(ladTable, object('folder'))).toBe(false);
    expect(policy.allow(ladTable, object('overlay-plot'))).toBe(false);
  });

  it('recognizes telemetry-producing objects', () => {
    expect(producesTelemetry(object('telemetry', { hints: ['range'] }))).toBe(true);
    expect(producesTelemetry(object('folder'))).toBe(false);
  });

  it('allows only LAD tables inside a LAD table set (02.03)', () => {
    const set = object('lad-table-set');
    expect(policy.allow(set, ladTable)).toBe(true);
    expect(policy.allow(set, object('telemetry', { hints: ['range'] }))).toBe(false);
  });

  it('does not constrain other parent types', () => {
    expect(policy.allow(object('folder'), object('folder'))).toBe(true);
  });
});
