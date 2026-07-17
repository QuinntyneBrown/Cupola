import { TestBed } from '@angular/core/testing';
import {
  ClockRegistry,
  DomainObject,
  IndependentTimeContext,
  LocalClock,
  TimeSystemRegistry,
} from '@cupola/core';

import { applyIndependentConfig, readIndependentTime } from './independent-time';

function strip(configuration: Record<string, unknown> | undefined): DomainObject {
  return {
    identifier: { namespace: '', key: 'strip' },
    keyString: 'strip',
    name: 'Strip',
    type: 'time-strip',
    location: null,
    composition: [],
    configuration,
  };
}

function context(): IndependentTimeContext {
  const systems = TestBed.inject(TimeSystemRegistry);
  systems.register({ key: 'utc', name: 'UTC', timeFormat: 'utc' });
  const clocks = TestBed.inject(ClockRegistry);
  clocks.register(new LocalClock(1000));
  return new IndependentTimeContext(systems, clocks);
}

describe('OMCT-C12-L2-02.03 Independent time conductor', () => {
  it('reads fixed independent-time configuration', () => {
    const config = readIndependentTime(
      strip({ independentTime: { enabled: true, mode: 'fixed', bounds: { start: 10, end: 20 } } }),
    );
    expect(config).toEqual({ enabled: true, mode: 'fixed', bounds: { start: 10, end: 20 }, offsets: undefined, clock: undefined });
  });

  it('returns null when independent time is absent or disabled', () => {
    expect(readIndependentTime(strip(undefined))).toBeNull();
    expect(readIndependentTime(strip({ independentTime: { enabled: false } }))).toBeNull();
  });

  it('applies fixed bounds to a scoped context', () => {
    const ctx = context();
    applyIndependentConfig(ctx, { enabled: true, mode: 'fixed', bounds: { start: 100, end: 500 } });
    expect(ctx.mode()).toBe('fixed');
    expect(ctx.bounds()).toEqual({ start: 100, end: 500 });
  });

  it('applies a clock in realtime mode', () => {
    const ctx = context();
    applyIndependentConfig(ctx, { enabled: true, mode: 'realtime', clock: 'local' });
    expect(ctx.mode()).toBe('realtime');
    expect(ctx.activeClockKey()).toBe('local');
  });
});
