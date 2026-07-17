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
  LimitRegistry,
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { PauseController } from '../../telemetry-view/pause-controller';
import { TelemetryStream, WideDatum } from '../../telemetry-view/telemetry-stream';
import { buildTicks, buildTimeTicks, timeTickValues } from './axes';
import { evaluateLimits } from './limit-overlay';
import { LegendMode, PlotConfiguration, readPlotConfig, resolveSeriesStyle } from './plot-config';
import { panBounds, zoomBounds } from './plot-interactions';
import { LegendSeries } from './plot-legend.component';
import { PlotLegendComponent } from './plot-legend.component';
import { extent, linearScale, niceTicks } from './scale';
import { linePath, projectSeries } from './series-path';

const VIEW_W = 760;
const VIEW_H = 260;
const AREA = { x: 56, y: 16, w: 648, h: 216 };

interface RenderSeries {
  keyString: string;
  name: string;
  color: string;
  unit: string;
  path: string;
  lineStyle: string;
  pointStyle: string;
  markers: { x: number; y: number }[];
  count: number;
  cursor: { x: number; y: number; value: string } | null;
}

interface RenderAxis {
  x: number;
  anchor: 'start' | 'end';
  ticks: { y: number; label: string }[];
  title: string;
  color: string | null;
}

interface PlotModel {
  series: RenderSeries[];
  yAxes: RenderAxis[];
  seriesAxes: { color: string; name: string }[];
  xTicks: { x: number; label: string }[];
  gridH: number[];
  gridV: number[];
  limitLines: { y: number; cssClass: string; label: string }[];
  alarms: { x: number; y: number; cssClass: string; edge: string }[];
  cursorX: number | null;
  legend: LegendSeries[];
  showLegend: boolean;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1000 || abs < 0.01)) {
    return value.toPrecision(3);
  }
  return String(Math.round(value * 100) / 100);
}

/**
 * Single-series and overlay plot view (OMCT-C07-L1-01/02/03). Renders historical
 * and realtime telemetry as SVG polylines over configured axes with pan/zoom/pause
 * navigation, an optional legend, gridlines, limit lines, and a cursor guide.
 *
 * In a restricted time-strip context (B11) it hides its controls, ignores
 * gestures, and follows the supplied {@link TimeContext}.
 */
@Component({
  selector: 'cp-plot-view',
  standalone: true,
  imports: [PlotLegendComponent],
  templateUrl: './plot-view.component.html',
  styleUrl: './plot-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly limits = inject(LimitRegistry);
  private readonly formats = inject(FormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();
  readonly restricted = input(false);

  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly area = AREA;
  protected readonly pause = new PauseController();
  protected readonly legendMode = signal<LegendMode>('collapsed');

  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly liveObject = signal<DomainObject | null>(null);
  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());
  private readonly cursorTime = signal<number | null>(null);
  private readonly frozen = signal<Map<string, WideDatum[]> | null>(null);

  private homeBounds: TimeBounds = { start: 0, end: 0 };
  private lastKey: string | null = null;

  private readonly currentObject = computed(() => this.liveObject() ?? this.object());
  private readonly config = computed<PlotConfiguration>(() => readPlotConfig(this.currentObject()));
  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);

  protected readonly model = computed<PlotModel>(() => this.buildModel());

  constructor() {
    // Object / context lifecycle: resolve members, track bounds and object updates.
    effect((onCleanup) => {
      const object = this.object();
      const context = this.context();
      const subs: Subscription[] = [];

      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);

      if (this.lastKey !== object.keyString) {
        this.lastKey = object.keyString;
        this.legendMode.set(readPlotConfig(object).legend);
        this.pause.resume();
        this.frozen.set(null);
      }
      this.viewBounds.set(context.bounds());
      this.homeBounds = context.bounds();

      subs.push(
        context.boundsChanged().subscribe((bounds) => {
          const wasPaused = this.pause.isPaused();
          this.viewBounds.set(bounds);
          if (wasPaused) {
            this.pause.resume();
            this.frozen.set(null);
            for (const stream of this.streams().values()) {
              stream.setFollowing(true);
              void stream.reload(bounds);
            }
          }
        }),
      );
      subs.push(
        this.objectUpdates.forKeyString(object.keyString).subscribe((updated) => this.liveObject.set(updated)),
      );

      onCleanup(() => {
        subs.forEach((sub) => sub.unsubscribe());
        members.destroy();
      });
    });

    // Rebuild the per-member streams whenever composition changes.
    effect((onCleanup) => {
      const members = this.members();
      const context = this.context();
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

  private context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }

  private timeFormatter(): (value: number) => string {
    const key = this.context().timeSystem().timeFormat;
    const format = this.formats.get(key);
    return format ? (value) => format.format(value) : (value) => new Date(value).toISOString().slice(11, 19);
  }

  private buildModel(): PlotModel {
    const bounds = this.viewBounds();
    const config = this.config();
    const members = this.members();
    const streamMap = this.streams();
    const frozen = this.frozen();
    const perSeries = config.yAxisMode === 'per-series';
    const formatTime = this.timeFormatter();

    const xScale = linearScale(bounds.start, bounds.end, AREA.x, AREA.x + AREA.w);
    const cursorT = this.cursorTime();

    const collected = members.map((member, index) => {
      const stream = streamMap.get(member.keyString);
      const points = (frozen ? (frozen.get(member.keyString) ?? []) : (stream?.points() ?? [])) as WideDatum[];
      const style = resolveSeriesStyle(config, member.keyString, index);
      const meta = this.metadata.getMetadata(member);
      const range = meta?.ranges()[0];
      const unit = range?.unit ?? member.telemetry?.unit ?? '';
      const values = points.map((point) => point.value);
      return { member, points, style, unit, values, name: member.name };
    });

    const sharedExtent = extent(collected.flatMap((entry) => entry.values));
    const sharedTicks = niceTicks(sharedExtent.min, sharedExtent.max, 5);
    const sharedScale = linearScale(sharedTicks[0], sharedTicks[sharedTicks.length - 1], AREA.y + AREA.h, AREA.y);

    const series: RenderSeries[] = [];
    const yAxes: RenderAxis[] = [];
    const seriesAxes: { color: string; name: string }[] = [];
    let limitLines: PlotModel['limitLines'] = [];
    let alarms: PlotModel['alarms'] = [];

    collected.forEach((entry, index) => {
      let yScale = sharedScale;
      if (perSeries) {
        const ext = extent(entry.values);
        const ticks = niceTicks(ext.min, ext.max, 4);
        yScale = linearScale(ticks[0], ticks[ticks.length - 1], AREA.y + AREA.h, AREA.y);
        seriesAxes.push({ color: entry.style.color, name: entry.unit ? `${entry.name} (${entry.unit})` : entry.name });
        if (index <= 1) {
          yAxes.push({
            x: index === 0 ? AREA.x : AREA.x + AREA.w,
            anchor: index === 0 ? 'end' : 'start',
            ticks: buildTicks(ticks, yScale, formatNumber).map((tick) => ({ y: tick.offset, label: tick.label })),
            title: entry.name,
            color: entry.style.color,
          });
        }
      }

      const projected = projectSeries(entry.points, xScale, yScale);
      const cursorPoint = cursorT === null ? null : nearest(projected, xScale.scale(cursorT));
      series.push({
        keyString: entry.member.keyString,
        name: entry.name,
        color: entry.style.color,
        unit: entry.unit,
        path: entry.style.lineStyle === 'none' ? '' : linePath(projected, entry.style.interpolation),
        lineStyle: entry.style.lineStyle,
        pointStyle: entry.style.pointStyle,
        markers: entry.style.pointStyle === 'dot' ? projected.slice(-200).map((point) => ({ x: point.x, y: point.y })) : [],
        count: projected.length,
        cursor: cursorPoint ? { x: cursorPoint.x, y: cursorPoint.y, value: formatNumber(cursorPoint.value) } : null,
      });

      if (config.limitLines && index === 0) {
        const evaluated = evaluateLimits(entry.member, entry.points, this.limits);
        limitLines = evaluated.lines.map((line) => ({
          y: yScale.scale(line.value),
          cssClass: line.cssClass ?? '',
          label: line.label,
        }));
        alarms = evaluated.alarms
          .map((alarm) => ({
            x: xScale.scale(alarm.timestamp),
            y: yScale.scale(alarm.value),
            cssClass: alarm.cssClass ?? '',
            edge: alarm.edge,
          }))
          .filter((alarm) => Number.isFinite(alarm.x) && Number.isFinite(alarm.y));
      }
    });

    if (!perSeries) {
      yAxes.push({
        x: AREA.x,
        anchor: 'end',
        ticks: buildTicks(sharedTicks, sharedScale, formatNumber).map((tick) => ({ y: tick.offset, label: tick.label })),
        title: collected[0]?.unit ? `${collected[0].name} (${collected[0].unit})` : (collected[0]?.name ?? ''),
        color: null,
      });
    }

    const xTickValues = timeTickValues(bounds, 6);
    const xTicks = buildTimeTicks(xTickValues, xScale, formatTime).map((tick) => ({ x: tick.offset, label: tick.label }));
    const gridBind = yAxes[0]?.ticks ?? [];

    return {
      series,
      yAxes,
      seriesAxes,
      xTicks,
      gridH: config.grid ? gridBind.map((tick) => tick.y) : [],
      gridV: config.grid ? xTicks.map((tick) => tick.x) : [],
      limitLines,
      alarms,
      cursorX: cursorT === null ? null : xScale.scale(cursorT),
      legend: collected.map((entry) => this.legendRow(entry, formatTime)),
      showLegend: members.length >= 2,
    };
  }

  private legendRow(
    entry: { member: DomainObject; points: WideDatum[]; style: { color: string }; unit: string; name: string; values: number[] },
    formatTime: (value: number) => string,
  ): LegendSeries {
    const last = entry.points[entry.points.length - 1];
    const ext = extent(entry.values);
    return {
      keyString: entry.member.keyString,
      name: entry.name,
      color: entry.style.color,
      unit: entry.unit,
      latest: last ? formatNumber(last.value) : '—',
      min: entry.values.length ? formatNumber(ext.min) : '—',
      max: entry.values.length ? formatNumber(ext.max) : '—',
      timestamp: last ? formatTime(Date.parse(last.timestamp)) : '—',
    };
  }

  // --- Interactions (OMCT-C07-L2-02.05, 02.06) ---

  protected toggleLegend(): void {
    this.legendMode.update((mode) => (mode === 'collapsed' ? 'expanded' : 'collapsed'));
  }

  protected zoomIn(): void {
    void this.applyBounds(zoomBounds(this.viewBounds(), 0.5));
  }

  protected zoomOut(): void {
    void this.applyBounds(zoomBounds(this.viewBounds(), 2));
  }

  protected panForward(): void {
    void this.applyBounds(panBounds(this.viewBounds(), 0.25));
  }

  protected reset(): void {
    void this.applyBounds(this.homeBounds);
  }

  protected togglePause(): void {
    if (this.restricted()) {
      return;
    }
    if (this.pause.isPaused()) {
      // Resume: unfreeze and follow active time again. The buffer already holds the
      // data that accumulated while paused, so we re-enable following without
      // discarding it by re-requesting (02.06).
      this.pause.resume();
      this.frozen.set(null);
      this.viewBounds.set(this.context().bounds());
      for (const stream of this.streams().values()) {
        stream.setFollowing(true);
      }
    } else {
      this.pause.pause();
      for (const stream of this.streams().values()) {
        stream.setFollowing(false);
      }
      this.snapshotFrozen();
    }
  }

  protected onPointerMove(event: PointerEvent, svg: Element): void {
    const rect = svg.getBoundingClientRect();
    const fraction = (((event.clientX - rect.left) / rect.width) * VIEW_W - AREA.x) / AREA.w;
    if (fraction < 0 || fraction > 1) {
      this.cursorTime.set(null);
      return;
    }
    const bounds = this.viewBounds();
    this.cursorTime.set(bounds.start + fraction * (bounds.end - bounds.start));
  }

  protected onPointerLeave(): void {
    this.cursorTime.set(null);
  }

  private async applyBounds(bounds: TimeBounds): Promise<void> {
    if (this.restricted() || bounds.end <= bounds.start) {
      return;
    }
    if (this.pause.isPaused()) {
      this.viewBounds.set(bounds);
      await Promise.all([...this.streams().values()].map((stream) => stream.reload(bounds)));
      this.snapshotFrozen();
      return;
    }
    this.viewBounds.set(bounds);
    this.context().setBounds(bounds);
  }

  private snapshotFrozen(): void {
    const snapshot = new Map<string, WideDatum[]>();
    for (const [key, stream] of this.streams()) {
      snapshot.set(key, [...stream.points()]);
    }
    this.frozen.set(snapshot);
  }
}

function nearest(points: { x: number; y: number; value: number }[], x: number): { x: number; y: number; value: number } | null {
  if (points.length === 0) {
    return null;
  }
  return points.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best));
}
