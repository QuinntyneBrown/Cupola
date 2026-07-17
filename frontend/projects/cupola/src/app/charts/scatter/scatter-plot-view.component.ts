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
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { TelemetryStream, WideDatum } from '../../telemetry-view/telemetry-stream';
import { buildTicks } from '../../views/plot/axes';
import { chartColor } from '../../views/plot/plot-config';
import { extent, linearScale, niceTicks } from '../../views/plot/scale';
import { readScatterConfig, scatterPoints } from './scatter-model';

const VIEW_W = 560;
const VIEW_H = 270;
const AREA = { x: 56, y: 20, w: 476, h: 200 };

interface ScatterRenderModel {
  points: { x: number; y: number }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
  gridX: number[];
  gridY: number[];
  xTitle: string;
  yTitle: string;
  color: string;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * Scatter plot view (OMCT-C07-L2-04.03/04.04): draws one point per sample from two
 * configured range keys of a composed telemetry stream, with a named axis each.
 */
@Component({
  selector: 'cp-scatter-plot-view',
  standalone: true,
  templateUrl: './scatter-plot-view.component.html',
  styleUrl: './scatter-plot-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScatterPlotViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly area = AREA;

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly stream = signal<TelemetryStream | null>(null);
  private readonly source = signal<DomainObject | null>(null);

  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly model = computed<ScatterRenderModel>(() => this.buildModel());

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);
      onCleanup(() => members.destroy());
    });

    effect((onCleanup) => {
      const member = this.members()[0] ?? null;
      this.source.set(member);
      if (!member) {
        this.stream.set(null);
        return;
      }
      const context = this.timeContext() ?? this.globalTime;
      const stream = new TelemetryStream(member, this.telemetry, context);
      stream.start();
      this.stream.set(stream);
      onCleanup(() => stream.destroy());
    });
  }

  private buildModel(): ScatterRenderModel {
    const source = this.source();
    const data = (this.stream()?.points() ?? []) as WideDatum[];
    const meta = source ? this.metadata.getMetadata(source) : undefined;
    const ranges = meta?.ranges() ?? [];
    const config = readScatterConfig(source?.configuration, ranges.map((range) => range.key));
    const points = scatterPoints(data, config);

    const xExt = extent(points.map((point) => point.x));
    const yExt = extent(points.map((point) => point.y));
    const xTicks = niceTicks(xExt.min, xExt.max, 5);
    const yTicks = niceTicks(yExt.min, yExt.max, 4);
    const xScale = linearScale(xTicks[0], xTicks[xTicks.length - 1], AREA.x, AREA.x + AREA.w);
    const yScale = linearScale(yTicks[0], yTicks[yTicks.length - 1], AREA.y + AREA.h, AREA.y);

    const title = (key: string) => {
      const range = ranges.find((entry) => entry.key === key);
      const name = range?.name ?? key;
      return range?.unit ? `${name} (${range.unit})` : name;
    };

    return {
      points: points.map((point) => ({ x: xScale.scale(point.x), y: yScale.scale(point.y) })),
      xTicks: buildTicks(xTicks, xScale, formatNumber).map((tick) => ({ x: tick.offset, label: tick.label })),
      yTicks: buildTicks(yTicks, yScale, formatNumber).map((tick) => ({ y: tick.offset, label: tick.label })),
      gridX: buildTicks(xTicks, xScale, formatNumber).map((tick) => tick.offset),
      gridY: buildTicks(yTicks, yScale, formatNumber).map((tick) => tick.offset),
      xTitle: title(config.xKey),
      yTitle: title(config.yKey),
      color: chartColor(1),
    };
  }
}
