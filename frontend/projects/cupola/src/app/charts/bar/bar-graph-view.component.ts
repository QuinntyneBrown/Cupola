import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { TelemetryStream, WideDatum } from '../../telemetry-view/telemetry-stream';
import { chartColor } from '../../views/plot/plot-config';
import { buildTicks } from '../../views/plot/axes';
import { linearScale, niceTicks } from '../../views/plot/scale';
import { barsFromMembers } from './bar-model';

const VIEW_W = 470;
const VIEW_H = 240;
const AREA = { x: 56, y: 24, w: 392, h: 180 };

interface RenderBar {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
}

interface BarModel {
  bars: RenderBar[];
  yTicks: { y: number; label: string }[];
  gridY: number[];
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * Bar and spectral chart view (OMCT-C07-L1-04). Renders one scalar bar per composed
 * member at its latest value, or a spectral series of bins when a member's datum
 * carries an array field (OMCT-C07-L2-04.02).
 */
@Component({
  selector: 'cp-bar-graph-view',
  standalone: true,
  templateUrl: './bar-graph-view.component.html',
  styleUrl: './bar-graph-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarGraphViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly area = AREA;

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());

  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly model = computed<BarModel>(() => this.buildModel());

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);
      onCleanup(() => members.destroy());
    });

    effect((onCleanup) => {
      const members = this.members();
      const context = this.timeContext() ?? this.globalTime;
      const streams = new Map<string, TelemetryStream>();
      for (const member of members) {
        const stream = new TelemetryStream(member, this.telemetry, context);
        stream.start();
        streams.set(member.keyString, stream);
      }
      this.streams.set(streams);
      onCleanup(() => streams.forEach((stream) => stream.destroy()));
    });
  }

  private buildModel(): BarModel {
    const members = this.members();
    const streamMap = this.streams();
    const data = members.map((member) => {
      const points = streamMap.get(member.keyString)?.points() ?? [];
      return { name: member.name, latest: (points[points.length - 1] ?? null) as WideDatum | null };
    });
    const bars = barsFromMembers(data);

    const maxValue = Math.max(0, ...bars.map((bar) => bar.value));
    const ticks = niceTicks(0, maxValue || 1, 4);
    const yScale = linearScale(ticks[0], ticks[ticks.length - 1], AREA.y + AREA.h, AREA.y);
    const baseline = AREA.y + AREA.h;
    const slot = bars.length > 0 ? AREA.w / bars.length : AREA.w;
    const barWidth = Math.max(4, slot - 4);

    const render: RenderBar[] = bars.map((bar, index) => {
      const top = yScale.scale(bar.value);
      return {
        label: bar.label,
        x: AREA.x + index * slot + (slot - barWidth) / 2,
        y: top,
        w: barWidth,
        h: Math.max(0, baseline - top),
        value: formatNumber(bar.value),
      };
    });

    return {
      bars: render,
      yTicks: buildTicks(ticks, yScale, formatNumber).map((tick) => ({ y: tick.offset, label: tick.label })),
      gridY: buildTicks(ticks, yScale, formatNumber).map((tick) => tick.offset),
    };
  }

  protected barColor(): string {
    return chartColor(1);
  }
}
