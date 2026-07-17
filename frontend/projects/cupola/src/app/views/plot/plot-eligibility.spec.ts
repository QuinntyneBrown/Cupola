import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { MultiRangeMetadataProvider } from './multi-range-metadata-provider';
import { isPlottable, isRangeTelemetry, numericRanges } from './plot-eligibility';

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

function metadata(): MetadataRegistry {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  registry.addProvider(TestBed.inject(MultiRangeMetadataProvider));
  return registry;
}

describe('plot eligibility', () => {
  it('accepts telemetry with a range hint and a numeric range (01.01)', () => {
    const registry = metadata();
    const busVoltage = object({ telemetry: { hints: ['range'], unit: 'V' } });
    expect(isRangeTelemetry(busVoltage, registry)).toBe(true);
    expect(isPlottable(busVoltage, registry)).toBe(true);
  });

  it('withholds a plot from imagery telemetry despite the default numeric range (01.02)', () => {
    const registry = metadata();
    // The default provider reports a numeric 'value' range even for imagery, so the
    // range-hint gate is what excludes it.
    const camera = object({ telemetry: { hints: ['image'] } });
    expect(numericRanges(camera, registry).length).toBeGreaterThanOrEqual(1);
    expect(isRangeTelemetry(camera, registry)).toBe(false);
    expect(isPlottable(camera, registry)).toBe(false);
  });

  it('treats an overlay plot as plottable', () => {
    expect(isPlottable(object({ type: 'overlay-plot', telemetry: null }), metadata())).toBe(true);
  });

  it('exposes multiple ranges for a marked multi-range object (04.03)', () => {
    const registry = metadata();
    const iv = object({ telemetry: { hints: ['range'] }, configuration: { ranges: ['current', 'voltage'] } });
    expect(numericRanges(iv, registry)).toHaveLength(2);
  });
});
