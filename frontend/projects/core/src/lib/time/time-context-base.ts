import { Observable, Subject } from 'rxjs';

import { ClockOffsets, TimeBounds, TimeMode, TimeSystem } from '../models/time';
import { Clock } from './clock';
import { ClockRegistry } from './clock-registry';
import { TimeContext } from './time-context';
import { TimeSystemRegistry } from './time-system-registry';

const DEFAULT_SYSTEM: TimeSystem = { key: 'utc', name: 'UTC', timeFormat: 'utc' };
const DEFAULT_REALTIME_OFFSETS: ClockOffsets = { start: -900_000, end: 0 };

/**
 * Concrete behaviour shared by the global and independent time contexts. It
 * owns the active time system, bounds, mode, offsets, active clock, and time
 * of interest, and publishes a change event for each. The change streams are
 * plain subjects (no replay): callers read the current value through the
 * synchronous getters and subscribe for future changes.
 *
 * Requirements: OMCT-C05-L2-01.02, 01.03, 01.04, 01.05, 03.01, 03.02, 03.03.
 */
export abstract class TimeContextBase extends TimeContext {
  private system: TimeSystem = DEFAULT_SYSTEM;
  private currentBounds: TimeBounds = { start: 0, end: 0 };
  private currentMode: TimeMode = 'fixed';
  private offsets: ClockOffsets | null = null;
  private activeClock: Clock | null = null;
  private clockUnsubscribe: (() => void) | null = null;
  private toi: number | null = null;

  private readonly boundsChanged$ = new Subject<TimeBounds>();
  private readonly modeChanged$ = new Subject<TimeMode>();
  private readonly tick$ = new Subject<number>();
  private readonly timeSystemChanged$ = new Subject<TimeSystem>();
  private readonly clockChanged$ = new Subject<string | null>();
  private readonly offsetsChanged$ = new Subject<ClockOffsets>();
  private readonly timeOfInterestChanged$ = new Subject<number | null>();

  protected constructor(
    private readonly systems: TimeSystemRegistry,
    private readonly clocks: ClockRegistry,
  ) {
    super();
  }

  // --- Frozen TimeContext contract ---

  override timeSystem(): TimeSystem {
    return this.system;
  }

  override bounds(): TimeBounds {
    return this.currentBounds;
  }

  override mode(): TimeMode {
    return this.currentMode;
  }

  override clockOffsets(): ClockOffsets | null {
    return this.offsets;
  }

  override setTimeSystem(key: string, bounds?: TimeBounds): void {
    const system = this.systems.get(key);
    if (!system) {
      throw new Error(`unknown time system: ${key}`);
    }
    this.system = system;
    this.timeSystemChanged$.next(system);
    if (bounds) {
      this.setBounds(bounds);
    }
  }

  override setBounds(bounds: TimeBounds): void {
    if (!Number.isFinite(bounds.start) || !Number.isFinite(bounds.end)) {
      throw new Error('bounds must be finite');
    }
    if (bounds.end < bounds.start) {
      throw new Error('end < start');
    }
    this.currentBounds = bounds;
    this.boundsChanged$.next(bounds);
    this.enforceTimeOfInterestContainment(bounds);
  }

  override boundsChanged(): Observable<TimeBounds> {
    return this.boundsChanged$.asObservable();
  }

  override modeChanged(): Observable<TimeMode> {
    return this.modeChanged$.asObservable();
  }

  override tick(): Observable<number> {
    return this.tick$.asObservable();
  }

  // --- C05 superset surface (not part of the frozen contract) ---

  /** The active clock key, or null in fixed mode. */
  activeClockKey(): string | null {
    return this.activeClock?.key ?? null;
  }

  /**
   * Activates a registered clock (real-time mode) or clears it (fixed mode).
   * Rejects an unknown key. Requirements: OMCT-C05-L2-03.01, 03.02.
   */
  setClock(key: string | null): void {
    if (key === null) {
      this.unsubscribeClock();
      this.activeClock = null;
      this.offsets = null;
      this.clockChanged$.next(null);
      if (this.currentMode !== 'fixed') {
        this.currentMode = 'fixed';
        this.modeChanged$.next('fixed');
      }
      return;
    }

    // Validate before mutating any state: rejecting an unknown key must be a
    // no-op that leaves the currently active clock and its subscription intact.
    const clock = this.clocks.get(key);
    if (!clock) {
      throw new Error(`unknown clock: ${key}`);
    }

    this.unsubscribeClock();
    this.activeClock = clock;
    if (this.offsets === null) {
      this.offsets = { ...DEFAULT_REALTIME_OFFSETS };
    }
    this.clockChanged$.next(clock.key);
    if (this.currentMode !== 'realtime') {
      this.currentMode = 'realtime';
      this.modeChanged$.next('realtime');
    }
    this.clockUnsubscribe = clock.subscribe((value) => this.onTick(value));
  }

  private unsubscribeClock(): void {
    if (this.clockUnsubscribe) {
      this.clockUnsubscribe();
      this.clockUnsubscribe = null;
    }
  }

  /** Sets the clock offsets used to derive real-time bounds. OMCT-C05-L2-03.03. */
  setClockOffsets(offsets: ClockOffsets): void {
    this.offsets = offsets;
    this.offsetsChanged$.next(offsets);
  }

  /** The active time of interest, or null when none is set. */
  timeOfInterest(): number | null {
    return this.toi;
  }

  /** Sets or clears the time of interest. OMCT-C05-L2-01.04, 01.05. */
  setTimeOfInterest(value: number | null): void {
    this.toi = value;
    this.timeOfInterestChanged$.next(value);
  }

  timeSystemChanged(): Observable<TimeSystem> {
    return this.timeSystemChanged$.asObservable();
  }

  clockChanged(): Observable<string | null> {
    return this.clockChanged$.asObservable();
  }

  offsetsChanged(): Observable<ClockOffsets> {
    return this.offsetsChanged$.asObservable();
  }

  timeOfInterestChanged(): Observable<number | null> {
    return this.timeOfInterestChanged$.asObservable();
  }

  private onTick(value: number): void {
    this.tick$.next(value);
    if (this.offsets) {
      const bounds: TimeBounds = {
        start: value + this.offsets.start,
        end: value + this.offsets.end,
      };
      this.currentBounds = bounds;
      this.boundsChanged$.next(bounds);
      this.enforceTimeOfInterestContainment(bounds);
    }
  }

  private enforceTimeOfInterestContainment(bounds: TimeBounds): void {
    if (this.toi !== null && (this.toi < bounds.start || this.toi > bounds.end)) {
      this.toi = null;
      this.timeOfInterestChanged$.next(null);
    }
  }
}
