import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomainObject } from '@cupola/core';

import { EventTimelineViewProvider } from './event-timeline-view-provider';

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

function provider(): EventTimelineViewProvider {
  return new EventTimelineViewProvider(TestBed.inject(EnvironmentInjector));
}

describe('OMCT-C12-L2-02.04 Event telemetry track', () => {
  it('offers the event timeline for domain-only telemetry', () => {
    expect(provider().canView(object({ telemetry: { hints: ['domain'] } }))).toBe(true);
  });

  it('withholds the event timeline when a range or image hint is present', () => {
    expect(provider().canView(object({ telemetry: { hints: ['domain', 'range'] } }))).toBe(false);
    expect(provider().canView(object({ telemetry: { hints: ['image'] } }))).toBe(false);
    expect(provider().canView(object({ telemetry: { hints: ['range'], unit: 'V' } }))).toBe(false);
  });

  it('withholds the event timeline from a non-telemetry object', () => {
    expect(provider().canView(object({ type: 'folder', telemetry: null }))).toBe(false);
  });
});
