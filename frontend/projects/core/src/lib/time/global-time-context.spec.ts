import { TestBed } from '@angular/core/testing';

import { TimeMode, TimeSystem } from '../models/time';
import { Clock } from './clock';
import { ClockRegistry } from './clock-registry';
import { GlobalTimeContext } from './global-time-context';
import { TimeSystemRegistry } from './time-system-registry';

/** A clock whose ticks are emitted manually, for deterministic tests. */
class ManualClock implements Clock {
  readonly name = 'Manual Clock';
  private readonly listeners = new Set<(tick: number) => void>();
  constructor(readonly key = 'manual') {}
  subscribe(callback: (tick: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  emit(value: number): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }
}

const UTC: TimeSystem = { key: 'utc', name: 'UTC', timeFormat: 'utc' };
const TAI: TimeSystem = { key: 'tai', name: 'TAI', timeFormat: 'utc' };

describe('GlobalTimeContext', () => {
  let context: GlobalTimeContext;
  let clock: ManualClock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    const systems = TestBed.inject(TimeSystemRegistry);
    systems.register(UTC);
    systems.register(TAI);
    clock = new ManualClock();
    TestBed.inject(ClockRegistry).register(clock);
    context = TestBed.inject(GlobalTimeContext);
  });

  describe('OMCT-C05-L2-01.02 Time-system activation', () => {
    it('activates a registered key and rejects an unknown key', () => {
      context.setTimeSystem('tai');
      expect(context.timeSystem()).toEqual(TAI);
      expect(() => context.setTimeSystem('bogus')).toThrow('unknown time system: bogus');
    });
  });

  describe('OMCT-C05-L2-01.03 Bounds validation', () => {
    it('stores valid bounds and rejects an invalid range', () => {
      context.setBounds({ start: 10, end: 20 });
      expect(context.bounds()).toEqual({ start: 10, end: 20 });
      expect(() => context.setBounds({ start: 20, end: 10 })).toThrow('end < start');
    });

    it('rejects non-finite bounds', () => {
      expect(() => context.setBounds({ start: Number.NaN, end: 20 })).toThrow();
      expect(() => context.setBounds({ start: 0, end: Number.POSITIVE_INFINITY })).toThrow();
    });
  });

  describe('OMCT-C05-L2-01.04 Time-of-interest containment', () => {
    it('clears the time of interest when new bounds exclude it', () => {
      context.setBounds({ start: 0, end: 100 });
      context.setTimeOfInterest(50);
      const seen: (number | null)[] = [];
      context.timeOfInterestChanged().subscribe((value) => seen.push(value));

      context.setBounds({ start: 60, end: 100 });

      expect(context.timeOfInterest()).toBeNull();
      expect(seen).toEqual([null]);
    });

    it('keeps the time of interest when new bounds still contain it', () => {
      context.setBounds({ start: 0, end: 100 });
      context.setTimeOfInterest(50);

      context.setBounds({ start: 0, end: 80 });

      expect(context.timeOfInterest()).toBe(50);
    });
  });

  describe('OMCT-C05-L2-01.05 Time change events', () => {
    it('notifies listeners of time-system, bounds, mode, tick, and TOI changes', () => {
      const events: string[] = [];
      context.timeSystemChanged().subscribe(() => events.push('system'));
      context.boundsChanged().subscribe(() => events.push('bounds'));
      context.modeChanged().subscribe(() => events.push('mode'));
      context.tick().subscribe(() => events.push('tick'));
      context.timeOfInterestChanged().subscribe(() => events.push('toi'));

      context.setTimeSystem('tai');
      context.setBounds({ start: 0, end: 10 });
      context.setClock('manual');
      clock.emit(1000);
      context.setTimeOfInterest(5);

      expect(events).toEqual(expect.arrayContaining(['system', 'bounds', 'mode', 'tick', 'toi']));
    });
  });

  describe('OMCT-C05-L2-03.01 Fixed and real-time modes', () => {
    it('reports fixed without a clock and real-time with one', () => {
      expect(context.mode()).toBe('fixed');
      const modes: TimeMode[] = [];
      context.modeChanged().subscribe((mode) => modes.push(mode));

      context.setClock('manual');
      expect(context.mode()).toBe('realtime');

      context.setClock(null);
      expect(context.mode()).toBe('fixed');

      expect(modes).toEqual(['realtime', 'fixed']);
    });
  });

  describe('OMCT-C05-L2-03.02 Registered-clock activation', () => {
    it('subscribes to a registered clock and rejects an unknown key', () => {
      context.setClock('manual');
      expect(context.activeClockKey()).toBe('manual');
      expect(() => context.setClock('nope')).toThrow('unknown clock: nope');
    });

    it('leaves the active clock intact when an unknown key is rejected', () => {
      context.setClock('manual');
      expect(() => context.setClock('nope')).toThrow('unknown clock: nope');

      // The rejection must be a no-op: the active clock keeps driving bounds.
      expect(context.mode()).toBe('realtime');
      expect(context.activeClockKey()).toBe('manual');
      clock.emit(5000);
      expect(context.bounds().end).toBe(5000);
    });
  });

  describe('OMCT-C05-L2-03.03 Clock-relative bounds', () => {
    it('derives bounds from the tick value and configured offsets', () => {
      context.setClock('manual');
      context.setClockOffsets({ start: -1000, end: 500 });

      clock.emit(10_000);

      expect(context.bounds()).toEqual({ start: 9000, end: 10_500 });
    });
  });
});
