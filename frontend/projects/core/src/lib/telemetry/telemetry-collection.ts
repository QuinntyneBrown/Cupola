import { Observable, Subject } from 'rxjs';

import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { TimeContext } from '../time/time-context';
import { TelemetryApiService } from './telemetry-api.service';
import { TelemetryMetadataView } from './telemetry-metadata-view';

/**
 * A bounded telemetry collection: loads historical data then subscribes to realtime
 * updates, keeping data within the time context's bounds.
 * Requirements: OMCT-C06-L2-04.01 (collection acquisition), 04.02 (time-metadata warning).
 */
export class TelemetryCollection {
  private data: TelemetryValue[] = [];
  private unsubscribe?: () => void;
  private readonly changes$ = new Subject<TelemetryValue[]>();
  readonly changes: Observable<TelemetryValue[]> = this.changes$.asObservable();

  constructor(
    private readonly object: DomainObject,
    private readonly api: TelemetryApiService,
    private readonly timeContext: TimeContext,
    metadata: TelemetryMetadataView | undefined,
  ) {
    const domainKey = this.timeContext.timeSystem().key;
    const hasDomain = metadata?.domains().some((value) => value.timeSystem === domainKey);
    if (metadata && !hasDomain) {
      console.warn(
        `Telemetry collection for '${this.object.keyString}' has no domain metadata for time system '${domainKey}'.`,
      );
    }
  }

  /** Loads historical data and begins receiving realtime updates. */
  async load(): Promise<void> {
    this.data = await this.api.request(this.object);
    this.bound();
    this.emit();
    this.unsubscribe = this.api.subscribe(this.object, (datum) => {
      const values = Array.isArray(datum) ? datum : [datum];
      this.data.push(...values);
      this.bound();
      this.emit();
    });
  }

  getAll(): TelemetryValue[] {
    return [...this.data];
  }

  destroy(): void {
    this.unsubscribe?.();
    this.changes$.complete();
  }

  private bound(): void {
    const { start, end } = this.timeContext.bounds();
    this.data = this.data.filter((datum) => {
      const time = Date.parse(datum.timestamp);
      return time >= start && time <= end;
    });
  }

  private emit(): void {
    this.changes$.next(this.getAll());
  }
}
