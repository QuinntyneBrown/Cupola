import { TestBed } from '@angular/core/testing';
import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { TimelineCompositionPolicy } from './timeline-composition-policy';

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

function policy(): TimelineCompositionPolicy {
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  return new TimelineCompositionPolicy(registry);
}

describe('OMCT-C12-L2-02.01 Time-strip composition', () => {
  const strip = object({ keyString: 'strip', type: 'time-strip', telemetry: null });

  it('accepts a plan and a gantt chart', () => {
    expect(policy().allow(strip, object({ type: 'plan', telemetry: null }))).toBe(true);
    expect(policy().allow(strip, object({ type: 'gantt-chart', telemetry: null }))).toBe(true);
  });

  it('accepts overlay plots and range telemetry', () => {
    expect(policy().allow(strip, object({ type: 'overlay-plot', telemetry: null }))).toBe(true);
    expect(policy().allow(strip, object({ telemetry: { hints: ['range'], unit: 'V' } }))).toBe(true);
  });

  it('accepts image telemetry and domain-only event telemetry', () => {
    expect(policy().allow(strip, object({ telemetry: { hints: ['image'] } }))).toBe(true);
    expect(policy().allow(strip, object({ telemetry: { hints: ['domain'] } }))).toBe(true);
  });

  it('rejects incompatible objects such as folders', () => {
    expect(policy().allow(strip, object({ type: 'folder', telemetry: null }))).toBe(false);
  });

  it('does not constrain other parents', () => {
    expect(policy().allow(object({ type: 'folder' }), object({ type: 'folder' }))).toBe(true);
  });
});
