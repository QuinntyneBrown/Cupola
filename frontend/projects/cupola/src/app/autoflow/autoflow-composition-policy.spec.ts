import { DomainObject } from '@cupola/core';

import { AutoflowCompositionPolicy } from './autoflow-composition-policy';

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

describe('Autoflow composition policy', () => {
  const policy = new AutoflowCompositionPolicy();
  const autoflow = object('autoflow');

  it('accepts telemetry-producing children', () => {
    expect(policy.allow(autoflow, object('telemetry', { hints: ['range'] }))).toBe(true);
  });

  it('rejects non-telemetry children', () => {
    expect(policy.allow(autoflow, object('folder'))).toBe(false);
  });

  it('does not constrain other parents', () => {
    expect(policy.allow(object('folder'), object('folder'))).toBe(true);
  });
});
