import { Signal, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DomainObject,
  TelemetryApiService,
  TelemetryFilter,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

/** A datum may carry fields beyond the scalar range (scatter x/y, spectral arrays). */
export type WideDatum = TelemetryValue & Record<string, unknown>;

const MAX_BUFFER = 2000;

/**
 * Drives one telemetry series for a chart: a single historical request for the
 * active bounds on start (OMCT-C07-L2-02.01), a realtime subscription merged into
 * the buffer (02.02), and a re-request whenever the followed bounds change. Panning
 * or zooming a paused plot re-requests through {@link reload} without resuming, so
 * `setFollowing(false)` detaches the stream from conductor bounds first (02.06).
 */
export class TelemetryStream {
  private readonly _points = signal<WideDatum[]>([]);
  private readonly _loading = signal(false);
  readonly points: Signal<WideDatum[]> = this._points.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  private unsubscribe?: () => void;
  private boundsSub?: Subscription;
  private following = true;
  private destroyed = false;
  private token = 0;
  private activeBounds: TimeBounds;

  constructor(
    private readonly object: DomainObject,
    private readonly telemetry: TelemetryApiService,
    private readonly time: TimeContext,
    private readonly filters?: TelemetryFilter[],
  ) {
    this.activeBounds = time.bounds();
  }

  start(): void {
    void this.reload();
    this.boundsSub = this.time.boundsChanged().subscribe((bounds) => {
      if (this.following) {
        void this.reload(bounds);
      }
    });
    const options = this.filters?.length ? { filters: this.filters } : undefined;
    this.unsubscribe = this.telemetry.subscribe(
      this.object,
      (datum) => {
        const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
        if (value) {
          this.append(value as WideDatum);
        }
      },
      options,
    );
  }

  /** Whether the stream re-requests when the conductor bounds change. */
  setFollowing(following: boolean): void {
    this.following = following;
  }

  /** Requests history for the given bounds (default: the current conductor window). */
  async reload(bounds: TimeBounds = this.time.bounds()): Promise<void> {
    const current = ++this.token;
    this.activeBounds = bounds;
    this._loading.set(true);
    let values: TelemetryValue[] = [];
    try {
      values = await this.telemetry.request(this.object, {
        bounds,
        domain: this.time.timeSystem().key,
        filters: this.filters,
      });
    } catch {
      values = [];
    }
    if (this.destroyed || current !== this.token) {
      return;
    }
    this._points.set(values as WideDatum[]);
    this._loading.set(false);
  }

  private append(value: WideDatum): void {
    const timestamp = Date.parse(value.timestamp);
    // Drop only far-past data; leading-edge realtime points render at the right
    // margin so a fixed-window plot still shows freshly pushed samples.
    if (Number.isFinite(timestamp) && timestamp < this.activeBounds.start) {
      return;
    }
    this._points.update((points) => {
      const next = [...points, value];
      return next.length > MAX_BUFFER ? next.slice(next.length - MAX_BUFFER) : next;
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubscribe?.();
    this.boundsSub?.unsubscribe();
  }
}
