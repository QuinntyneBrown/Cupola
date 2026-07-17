import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { BarGraphCompositionPolicy } from './bar-graph-composition-policy';

function object(overrides: Partial<DomainObject>): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'k',
    type: 'telemetry',
    location: null,
    composition: [],
    ...overrides,
  };
}

function policy(): BarGraphCompositionPolicy {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  return new BarGraphCompositionPolicy(registry);
}

describe('OMCT-C07-L2-04.01 Bar-chart eligibility', () => {
  const bar = object({ keyString: 'bg', type: 'bar-graph', telemetry: null });

  it('allows compatible range telemetry', () => {
    expect(policy().allow(bar, object({ telemetry: { hints: ['range'], unit: 'A' } }))).toBe(true);
  });

  it('rejects a condition set', () => {
    expect(policy().allow(bar, object({ type: 'condition-set', telemetry: null }))).toBe(false);
  });

  it('rejects an object with no range', () => {
    expect(policy().allow(bar, object({ type: 'folder', telemetry: null }))).toBe(false);
  });
});
