import { Observable, ReplaySubject } from 'rxjs';
import { ClockOffsets, TimeBounds, TimeMode, TimeSystem, TimeContext } from '@cupola/core';

/**
 * Fake time context standing behind the B05 contract so consuming capabilities
 * build and test before C05 delivers the provider.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export class FakeTimeContext extends TimeContext {
  private readonly bounds$ = new ReplaySubject<TimeBounds>(1);
  private readonly mode$ = new ReplaySubject<TimeMode>(1);
  private current: { system: TimeSystem; bounds: TimeBounds; mode: TimeMode } = {
    system: { key: 'utc', name: 'UTC', timeFormat: 'iso' },
    bounds: { start: 0, end: 0 },
    mode: 'fixed',
  };
  override timeSystem(): TimeSystem {
    return this.current.system;
  }
  override bounds(): TimeBounds {
    return this.current.bounds;
  }
  override mode(): TimeMode {
    return this.current.mode;
  }
  override clockOffsets(): ClockOffsets | null {
    return null;
  }
  override setTimeSystem(key: string, bounds?: TimeBounds): void {
    /* test hook */
  }
  override setBounds(bounds: TimeBounds): void {
    if (bounds.end < bounds.start) {
      throw new Error('end < start');
    }
    this.current.bounds = bounds;
    this.bounds$.next(bounds);
  }
  override boundsChanged(): Observable<TimeBounds> {
    return this.bounds$.asObservable();
  }
  override modeChanged(): Observable<TimeMode> {
    return this.mode$.asObservable();
  }
  override tick(): Observable<number> {
    return new ReplaySubject<number>(1).asObservable();
  }
}
