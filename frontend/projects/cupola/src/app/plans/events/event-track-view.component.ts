import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DomainObject,
  FormatRegistry,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { ExtendedLinesBus } from '../time-strip/extended-lines-bus';
import { createTimeScale } from '../plan/time-scale';

/** Maximum markers rendered so a dense event stream stays legible. */
const MAX_MARKERS = 40;

interface EventMarker {
  timestamp: number;
  leftPct: number;
  label: string;
}

/**
 * Event telemetry track (OMCT-C12-L2-02.04). Requests domain-only event
 * telemetry for the active bounds and renders each event as a marker positioned
 * on the shared time scale, appending realtime events. Selecting a marker
 * publishes an extended line across the strip's rows (02.05).
 */
@Component({
  selector: 'cp-event-track-view',
  standalone: true,
  templateUrl: './event-track-view.component.html',
  styleUrl: './event-track-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'event-track', class: 'event-host' },
})
export class EventTrackViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly globalTime = inject(TimeContext);
  private readonly formats = inject(FormatRegistry);
  private readonly bus = inject(ExtendedLinesBus);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();
  readonly restricted = input(false);

  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly events = signal<TelemetryValue[]>([]);
  private readonly selectedTimestamp = signal<number | null>(null);
  private token = 0;

  protected readonly markers = computed<EventMarker[]>(() => {
    const scale = createTimeScale(this.viewBounds());
    const formatTime = this.timeFormatter();
    return this.events()
      .slice(-MAX_MARKERS)
      .map((event) => {
        const timestamp = Date.parse(event.timestamp);
        return { timestamp, leftPct: scale.clampedOffset(timestamp), label: formatTime(timestamp) };
      })
      .filter((marker) => Number.isFinite(marker.timestamp));
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.context();
      const subs: Subscription[] = [];

      this.viewBounds.set(context.bounds());
      void this.reload(object, context.bounds());
      subs.push(
        context.boundsChanged().subscribe((bounds) => {
          this.viewBounds.set(bounds);
          void this.reload(object, bounds);
        }),
      );

      const unsubscribe = this.telemetry.subscribe(object, (datum) => {
        const values = Array.isArray(datum) ? datum : [datum];
        this.events.update((current) => [...current, ...values]);
      });

      const busSub = this.bus.changes.subscribe((line) =>
        this.selectedTimestamp.set(line ? line.timestamp : null),
      );

      onCleanup(() => {
        subs.forEach((sub) => sub.unsubscribe());
        busSub.unsubscribe();
        unsubscribe();
      });
    });
  }

  protected isSelected(marker: EventMarker): boolean {
    return this.selectedTimestamp() === marker.timestamp;
  }

  protected selectMarker(marker: EventMarker): void {
    this.bus.publish({ sourceKey: this.object().keyString, timestamp: marker.timestamp });
  }

  private async reload(object: DomainObject, bounds: TimeBounds): Promise<void> {
    const current = ++this.token;
    const values = await this.telemetry.request(object, { bounds });
    if (current === this.token) {
      this.events.set(values);
    }
  }

  private context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.context().timeSystem().timeFormat);
    return format
      ? (value) => format.format(value)
      : (value) => new Date(value).toISOString().slice(11, 19);
  }
}
