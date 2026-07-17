import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { OverlayPlotCompositionPolicy } from './overlay-plot-composition-policy';

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

function policy(): OverlayPlotCompositionPolicy {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  return new OverlayPlotCompositionPolicy(registry);
}

describe('OMCT-C07-L2-01.03 Overlay plot composition', () => {
  const overlay = object({ keyString: 'op', type: 'overlay-plot', telemetry: null });

  it('allows numeric-range telemetry as a series', () => {
    expect(policy().allow(overlay, object({ telemetry: { hints: ['range'], unit: 'V' } }))).toBe(true);
  });

  it('rejects imagery telemetry', () => {
    expect(policy().allow(overlay, object({ telemetry: { hints: ['image'] } }))).toBe(false);
  });

  it('rejects a non-telemetry child', () => {
    expect(policy().allow(overlay, object({ type: 'folder', telemetry: null }))).toBe(false);
  });

  it('does not constrain other parents', () => {
    expect(policy().allow(object({ type: 'folder' }), object({ type: 'folder' }))).toBe(true);
  });
});
