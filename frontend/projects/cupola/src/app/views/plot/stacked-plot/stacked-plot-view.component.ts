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
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../../telemetry-view/composition-members';
import { TelemetryStream } from '../../../telemetry-view/telemetry-stream';
import { buildTicks, buildTimeTicks, timeTickValues } from '../axes';
import { chartColor, readPlotConfig } from '../plot-config';
import { extent, linearScale, niceTicks } from '../scale';
import { linePath, projectSeries } from '../series-path';

const VIEW_W = 760;
const LEFT = 56;
const RIGHT = 16;
const TOP = 8;
const ROW_H = 96;
const ROW_PAD_TOP = 20;
const ROW_PAD_BOTTOM = 8;
const AXIS_H = 28;

interface RowSpec {
  key: string;
  name: string;
  seriesObjects: DomainObject[];
}

interface RenderRowSeries {
  keyString: string;
  color: string;
  path: string;
  cursor: { x: number; y: number } | null;
}

interface RenderRow {
  key: string;
  label: string;
  color: string;
  y: number;
  h: number;
  ticks: { y: number; label: string }[];
  gridH: number[];
  series: RenderRowSeries[];
}

interface StackedModel {
  viewBox: string;
  width: number;
  rows: RenderRow[];
  gridV: number[];
  xTicks: { x: number; label: string }[];
  xAxisY: number;
  cursorX: number | null;
  height: number;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return String(Math.round(value * 100) / 100);
}

/**
 * Stacked plot view: one row and y axis per composed child sharing a single time
 * axis, with a cursor guide coordinated across every row (OMCT-C07-L2-01.04,
 * 03.02, 03.03). Rows are added and removed live as composition changes.
 */
@Component({
  selector: 'cp-stacked-plot-view',
  standalone: true,
  templateUrl: './stacked-plot-view.component.html',
  styleUrl: './stacked-plot-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackedPlotViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly formats = inject(FormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();
  readonly restricted = input(false);

  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly rows = signal<RowSpec[]>([]);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());
  private readonly cursorTime = signal<number | null>(null);
  private rowToken = 0;

  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly model = computed<StackedModel>(() => this.buildModel());

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.context();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);
      this.viewBounds.set(context.bounds());
      const sub: Subscription = context.boundsChanged().subscribe((bounds) => this.viewBounds.set(bounds));
      onCleanup(() => {
        sub.unsubscribe();
        members.destroy();
      });
    });

    effect(() => {
      const members = this.members();
      void this.resolveRows(members);
    });

    effect((onCleanup) => {
      const rows = this.rows();
      const context = this.context();
      const streams = new Map<string, TelemetryStream>();
      for (const row of rows) {
        for (const object of row.seriesObjects) {
          if (!streams.has(object.keyString)) {
            const stream = new TelemetryStream(object, this.telemetry, context);
            stream.start();
            streams.set(object.keyString, stream);
          }
        }
      }
      this.streams.set(streams);
      onCleanup(() => streams.forEach((stream) => stream.destroy()));
    });
  }

  private context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }

  private async resolveRows(children: DomainObject[]): Promise<void> {
    const token = ++this.rowToken;
    const rows: RowSpec[] = [];
    for (const child of children) {
      if (child.type === 'overlay-plot' && child.composition.length > 0) {
        const resolved = await Promise.all(child.composition.map((key) => this.objects.get(key).catch(() => null)));
        rows.push({
          key: child.keyString,
          name: child.name,
          seriesObjects: resolved.filter((object): object is DomainObject => object !== null),
        });
      } else {
        rows.push({ key: child.keyString, name: child.name, seriesObjects: [child] });
      }
    }
    if (token === this.rowToken) {
      this.rows.set(rows);
    }
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.context().timeSystem().timeFormat);
    return format ? (value) => format.format(value) : (value) => new Date(value).toISOString().slice(11, 19);
  }

  private buildModel(): StackedModel {
    const bounds = this.viewBounds();
    const rows = this.rows();
    const streamMap = this.streams();
    const grid = readPlotConfig(this.object()).grid;
    const width = VIEW_W;
    const height = TOP + rows.length * ROW_H + AXIS_H;
    const xScale = linearScale(bounds.start, bounds.end, LEFT, width - RIGHT);
    const cursorT = this.cursorTime();
    let colorIndex = 0;

    const renderRows: RenderRow[] = rows.map((row, rowIndex) => {
      const top = TOP + rowIndex * ROW_H + ROW_PAD_TOP;
      const bottom = TOP + rowIndex * ROW_H + ROW_H - ROW_PAD_BOTTOM;
      const rowColor = chartColor(rowIndex + 1);
      const allValues = row.seriesObjects.flatMap((object) => {
        const stream = streamMap.get(object.keyString);
        return (stream?.points() ?? []).map((point) => point.value);
      });
      const ext = extent(allValues);
      const ticks = niceTicks(ext.min, ext.max, 3);
      const yScale = linearScale(ticks[0], ticks[ticks.length - 1], bottom, top);
      const unit = row.seriesObjects[0]?.telemetry?.unit ?? '';

      const series: RenderRowSeries[] = row.seriesObjects.map((object) => {
        const color = chartColor((colorIndex += 1));
        const points = streamMap.get(object.keyString)?.points() ?? [];
        const projected = projectSeries(points, xScale, yScale);
        const cursorPoint = cursorT === null ? null : nearest(projected, xScale.scale(cursorT));
        return {
          keyString: object.keyString,
          color,
          path: linePath(projected),
          cursor: cursorPoint ? { x: cursorPoint.x, y: cursorPoint.y } : null,
        };
      });

      return {
        key: row.key,
        label: unit ? `${row.name} (${unit})` : row.name,
        color: rowColor,
        y: top,
        h: bottom - top,
        ticks: buildTicks(ticks, yScale, formatNumber).map((tick) => ({ y: tick.offset, label: tick.label })),
        gridH: grid ? buildTicks(ticks, yScale, formatNumber).map((tick) => tick.offset) : [],
        series,
      };
    });

    const xAxisY = TOP + rows.length * ROW_H;
    const xTickValues = timeTickValues(bounds, 6);
    const xTicks = buildTimeTicks(xTickValues, xScale, this.timeFormatter()).map((tick) => ({ x: tick.offset, label: tick.label }));

    return {
      viewBox: `0 0 ${width} ${height}`,
      width,
      rows: renderRows,
      gridV: grid ? xTicks.map((tick) => tick.x) : [],
      xTicks,
      xAxisY,
      cursorX: cursorT === null ? null : xScale.scale(cursorT),
      height,
    };
  }

  protected onPointerMove(event: PointerEvent, svg: Element): void {
    const rect = svg.getBoundingClientRect();
    const fraction = (((event.clientX - rect.left) / rect.width) * VIEW_W - LEFT) / (VIEW_W - LEFT - RIGHT);
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
}

function nearest(points: { x: number; y: number }[], x: number): { x: number; y: number } | null {
  if (points.length === 0) {
    return null;
  }
  return points.reduce((best, point) => (Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best));
}
