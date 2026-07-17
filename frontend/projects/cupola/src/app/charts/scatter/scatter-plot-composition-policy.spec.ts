import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { MultiRangeMetadataProvider } from '../../views/plot/multi-range-metadata-provider';
import { ScatterPlotCompositionPolicy } from './scatter-plot-composition-policy';

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

function policy(): ScatterPlotCompositionPolicy {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  registry.addProvider(TestBed.inject(MultiRangeMetadataProvider));
  return new ScatterPlotCompositionPolicy(registry);
}

describe('OMCT-C07-L2-04.03 Scatter-plot eligibility', () => {
  const scatter = object({ keyString: 'sc', type: 'scatter-plot', telemetry: null });

  it('allows a child that supplies two ranges', () => {
    const iv = object({ telemetry: { hints: ['range'] }, configuration: { ranges: ['current', 'voltage'] } });
    expect(policy().allow(scatter, iv)).toBe(true);
  });

  it('rejects a child with only one range', () => {
    expect(policy().allow(scatter, object({ telemetry: { hints: ['range'], unit: 'V' } }))).toBe(false);
  });
});
