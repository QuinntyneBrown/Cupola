import { Observable } from 'rxjs';
import { ClockOffsets, TimeBounds, TimeMode, TimeSystem } from '../models/time';

/**
 * B05 — Time coordination (contract skeleton).
 * Owner: C05 · Consumers: C06, C07, C08, C11, C12 · Stability: high.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export abstract class TimeContext {
  abstract timeSystem(): TimeSystem;
  abstract bounds(): TimeBounds;
  abstract mode(): TimeMode;
  abstract clockOffsets(): ClockOffsets | null;
  abstract setTimeSystem(key: string, bounds?: TimeBounds): void;
  abstract setBounds(bounds: TimeBounds): void; // rejects end < start
  abstract boundsChanged(): Observable<TimeBounds>; // OMCT-C05-L2-01.05
  abstract modeChanged(): Observable<TimeMode>;
  abstract tick(): Observable<number>; // clock ticks in realtime mode
}
// Views with independent time controls (C12 time strip) receive a TimeContext instance
// scoped to the view; the global context is the default (OMCT-C05-L2-02.01–02.03).
