import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { StackedPlotCompositionPolicy } from './stacked-plot-composition-policy';

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

function policy(): StackedPlotCompositionPolicy {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  return new StackedPlotCompositionPolicy(registry);
}

describe('OMCT-C07-L2-01.04 Stacked plot composition', () => {
  const stacked = object({ keyString: 'sp', type: 'stacked-plot', telemetry: null });

  it('allows range telemetry as a row', () => {
    expect(policy().allow(stacked, object({ telemetry: { hints: ['range'] } }))).toBe(true);
  });

  it('allows an overlay plot as a row', () => {
    expect(policy().allow(stacked, object({ type: 'overlay-plot', telemetry: null }))).toBe(true);
  });

  it('rejects an incompatible child', () => {
    expect(policy().allow(stacked, object({ type: 'folder', telemetry: null }))).toBe(false);
    expect(policy().allow(stacked, object({ telemetry: { hints: ['image'] } }))).toBe(false);
  });
});
