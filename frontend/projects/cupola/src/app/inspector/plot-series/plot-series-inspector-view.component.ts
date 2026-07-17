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
  SelectedItem,
} from '@cupola/core';

import { ViewConfigService } from '../../telemetry-view/view-config.service';
import {
  Interpolation,
  LegendMode,
  LineStyle,
  PlotConfiguration,
  PointStyle,
  SeriesStyle,
  YAxisMode,
  chartColor,
  readPlotConfig,
} from '../../views/plot/plot-config';
import { ScatterConfig, readScatterConfig } from '../../charts/scatter/scatter-model';

const PLOT_TYPES = new Set(['overlay-plot', 'stacked-plot', 'telemetry']);
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

interface SeriesRow {
  keyString: string;
  name: string;
  style: SeriesStyle;
  color: string;
}

/**
 * Plot-series inspector (OMCT-C07-L2-04.05): edits per-series palette, interpolation,
 * line, and point styles plus grid, limit-line, legend, y-axis-mode, and scatter axis
 * options, persisting each change to the object's configuration and reflecting it in
 * the open view.
 */
@Component({
  selector: 'cp-plot-series-inspector-view',
  standalone: true,
  templateUrl: './plot-series-inspector-view.component.html',
  styleUrl: './plot-series-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotSeriesInspectorViewComponent {
  private readonly viewConfig = inject(ViewConfigService);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly metadata = inject(MetadataRegistry);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly slots = SLOTS;
  private readonly liveObject = signal<DomainObject | null>(null);
  private readonly members = signal<DomainObject[]>([]);

  private readonly selected = computed(() => this.selection()[0]?.context.object ?? null);
  protected readonly object = computed(() => this.liveObject() ?? this.selected());
  protected readonly config = computed<PlotConfiguration>(() => {
    const object = this.object();
    return object ? readPlotConfig(object) : readPlotConfig(emptyObject());
  });
  protected readonly isPlot = computed(() => PLOT_TYPES.has(this.object()?.type ?? ''));
  protected readonly isScatter = computed(() => this.object()?.type === 'scatter-plot');
  protected readonly rangeKeys = computed(() => {
    const first = this.members()[0];
    return first ? (this.metadata.getMetadata(first)?.ranges().map((range) => range.key) ?? []) : [];
  });
  protected readonly scatter = computed<ScatterConfig>(() => readScatterConfig(this.object()?.configuration, this.rangeKeys()));
  protected readonly series = computed<SeriesRow[]>(() => {
    const config = this.config();
    return this.members().map((member, index) => {
      const style = config.series[member.keyString] ?? {};
      return {
        keyString: member.keyString,
        name: member.name,
        style,
        color: chartColor(style.colorSlot ?? index + 1),
      };
    });
  });

  constructor() {
    effect(() => {
      const object = this.selected();
      this.liveObject.set(null);
      if (object) {
        void this.resolveMembers(object);
      } else {
        this.members.set([]);
      }
    });
  }

  private async resolveMembers(object: DomainObject): Promise<void> {
    const keys = object.composition ?? [];
    if (keys.length === 0) {
      this.members.set(object.telemetry ? [object] : []);
      return;
    }
    const resolved = await Promise.all(keys.map((key) => this.objects.get(key).catch(() => null)));
    if (this.selected()?.keyString === object.keyString) {
      this.members.set(resolved.filter((member): member is DomainObject => member !== null));
    }
  }

  protected chartColor(slot: number): string {
    return chartColor(slot);
  }

  protected setGrid(event: Event): void {
    const grid = (event.target as HTMLInputElement).checked;
    void this.persistPlot((config) => ({ ...config, grid }));
  }

  protected setLimitLines(event: Event): void {
    const limitLines = (event.target as HTMLInputElement).checked;
    void this.persistPlot((config) => ({ ...config, limitLines }));
  }

  protected setLegend(mode: LegendMode): void {
    void this.persistPlot((config) => ({ ...config, legend: mode }));
  }

  protected setYAxisMode(mode: YAxisMode): void {
    void this.persistPlot((config) => ({ ...config, yAxisMode: mode }));
  }

  protected setColor(keyString: string, slot: number): void {
    void this.persistSeries(keyString, { colorSlot: slot });
  }

  protected setInterpolation(keyString: string, event: Event): void {
    void this.persistSeries(keyString, { interpolation: (event.target as HTMLSelectElement).value as Interpolation });
  }

  protected setLineStyle(keyString: string, event: Event): void {
    void this.persistSeries(keyString, { lineStyle: (event.target as HTMLSelectElement).value as LineStyle });
  }

  protected setPointStyle(keyString: string, event: Event): void {
    void this.persistSeries(keyString, { pointStyle: (event.target as HTMLSelectElement).value as PointStyle });
  }

  protected setScatterKey(axis: 'xKey' | 'yKey', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const current = this.scatter();
    void this.persist('scatter', () => ({ ...current, [axis]: value }));
  }

  private persistSeries(keyString: string, changes: Partial<SeriesStyle>): Promise<void> {
    return this.persistPlot((config) => ({
      ...config,
      series: { ...config.series, [keyString]: { ...config.series[keyString], ...changes } },
    }));
  }

  private persistPlot(mutate: (config: PlotConfiguration) => PlotConfiguration): Promise<void> {
    return this.persist('plot', () => mutate(this.config()));
  }

  private async persist(family: string, produce: () => unknown): Promise<void> {
    const object = this.object();
    if (!object) {
      return;
    }
    const value = produce();
    // Apply optimistically so a rapid follow-up edit reads this change rather than
    // the not-yet-persisted original and clobbers it.
    const optimistic: DomainObject = {
      ...object,
      configuration: { ...object.configuration, [family]: JSON.parse(JSON.stringify(value)) },
    };
    this.liveObject.set(optimistic);
    const saved = await this.viewConfig.write(object, family, value);
    this.liveObject.set(saved);
    this.objectUpdates.emitLocal(saved);
  }
}

function emptyObject(): DomainObject {
  return { identifier: { namespace: '', key: '' }, keyString: '', name: '', type: '', location: null, composition: [] };
}
