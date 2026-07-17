import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, TelemetryApiService, TimeBounds, TimeContext } from '@cupola/core';

import { TelemetryStream } from '../../../telemetry-view/telemetry-stream';
import { createTimeScale } from '../../../plans/plan/time-scale';
import { toImageFrames } from '../image-history';

/**
 * Imagery as a time-strip child (OMCT-C11-L2-01.05, B11): thumbnails
 * positioned along the container's shared axis by the supplied TimeContext,
 * re-requested on bounds changes so images outside the new bounds drop. The
 * view exposes no time controls of its own.
 */
@Component({
  selector: 'cp-imagery-time-view',
  template: `
    <div class="im-track" data-testid="imagery-track" [attr.data-key]="object().keyString">
      @for (frame of framesInBounds(); track frame.time) {
        <img
          class="im-track-thumb"
          data-testid="imagery-track-thumb"
          [attr.data-time]="frame.time"
          [src]="frame.url"
          [alt]="object().name + ' at ' + frame.timestampIso"
          [style.left.%]="scale().clampedOffset(frame.time)"
          draggable="false"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .im-track {
      position: relative;
      height: 100%;
      min-height: 56px;
    }
    .im-track-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 58px;
      height: 38px;
      object-fit: cover;
      border-radius: 2px;
      border: 1px solid var(--cp-color-hairline);
      background: #05070c;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageryTimeViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext | undefined>(undefined);
  readonly restricted = input(false);

  private readonly stream = signal<TelemetryStream | null>(null);
  private readonly bounds = signal<TimeBounds>({ start: 0, end: 1 });

  protected readonly scale = computed(() => createTimeScale(this.bounds()));
  protected readonly framesInBounds = computed(() => {
    const scale = this.scale();
    return toImageFrames(this.stream()?.points() ?? []).filter((frame) =>
      scale.contains(frame.time),
    );
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.timeContext() ?? this.globalTime;
      this.bounds.set(context.bounds());
      const stream = new TelemetryStream(object, this.telemetry, context);
      stream.start();
      this.stream.set(stream);
      const subscription = context.boundsChanged().subscribe((bounds) => this.bounds.set(bounds));
      onCleanup(() => {
        stream.destroy();
        subscription.unsubscribe();
      });
    });
  }
}
