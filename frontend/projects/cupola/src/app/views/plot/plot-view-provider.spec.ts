import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { PlotViewProvider } from './plot-view-provider';
import { MultiRangeMetadataProvider } from './multi-range-metadata-provider';

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

function provider(): PlotViewProvider {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  registry.addProvider(TestBed.inject(MultiRangeMetadataProvider));
  return new PlotViewProvider(TestBed.inject(EnvironmentInjector), registry);
}

describe('OMCT-C07-L2-01.01 Numeric telemetry plot', () => {
  it('offers the plot view for telemetry with a numeric range', () => {
    expect(provider().canView(object({ telemetry: { hints: ['range'], unit: 'V' } }))).toBe(true);
  });

  it('offers the plot view for an overlay plot', () => {
    expect(provider().canView(object({ type: 'overlay-plot', telemetry: null }))).toBe(true);
  });
});

describe('OMCT-C07-L2-01.02 Nonnumeric exclusion', () => {
  it('withholds the plot view from imagery telemetry', () => {
    expect(provider().canView(object({ telemetry: { hints: ['image'] } }))).toBe(false);
  });

  it('withholds the plot view from a folder', () => {
    expect(provider().canView(object({ type: 'folder', telemetry: null }))).toBe(false);
  });
});
