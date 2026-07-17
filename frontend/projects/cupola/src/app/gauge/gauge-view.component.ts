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
  LimitRegistry,
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  StalenessRegistry,
  TelemetryApiService,
  TimeContext,
  ValueFormatRegistry,
} from '@cupola/core';

import { CompositionMembers } from '../telemetry-view/composition-members';
import { TelemetryStream, WideDatum } from '../telemetry-view/telemetry-stream';
import { formatField, limitStateClass } from '../tabular/telemetry-cell';
import { GaugeConfiguration, isDial, readGaugeConfig } from './gauge-config';
import { fillPath, needle, trackPath } from './gauge-dial';
import { GaugeScale, percent, resolveScale, valueFraction } from './gauge-scale';

interface GaugeModel {
  form: GaugeConfiguration['form'];
  isDial: boolean;
  hasValue: boolean;
  value: string;
  unit: string;
  scale: GaugeScale;
  fillPct: string;
  lowPct: string | null;
  highPct: string | null;
  limitState: string;
  stale: boolean;
  min: string;
  max: string;
  track: string;
  fill: string;
  needle: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * Gauge view (OMCT-C08-L1-03): renders the latest numeric value of a single
 * composed telemetry source in one of five forms — filled/needle dials as SVG,
 * vertical/inverted/horizontal meters as DOM — with a manual or telemetry-derived
 * scale and limit markers (OMCT-C08-L2-03.01/03.02/03.03).
 */
@Component({
  selector: 'cp-gauge-view',
  standalone: true,
  templateUrl: './gauge-view.component.html',
  styleUrl: './gauge-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly limits = inject(LimitRegistry);
  private readonly staleness = inject(StalenessRegistry);
  private readonly formats = inject(ValueFormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  private readonly liveObject = signal<DomainObject | null>(null);
  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly stream = signal<TelemetryStream | null>(null);
  private readonly stale = signal(false);

  protected readonly currentObject = computed(() => this.liveObject() ?? this.object());
  protected readonly member = computed(() => this.membersCtl()?.members()[0] ?? null);
  protected readonly model = computed<GaugeModel>(() => this.buildModel());

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);
      const sub = this.objectUpdates
        .forKeyString(object.keyString)
        .subscribe((updated) => this.liveObject.set(updated));
      onCleanup(() => {
        members.destroy();
        sub.unsubscribe();
      });
    });

    effect((onCleanup) => {
      const member = this.member();
      const context = this.timeContext() ?? this.globalTime;
      if (!member) {
        this.stream.set(null);
        return;
      }
      const stream = new TelemetryStream(member, this.telemetry, context);
      stream.start();
      this.stream.set(stream);
      const unsubscribe = this.staleness.subscribe(member, (event) => this.stale.set(event.isStale));
      onCleanup(() => {
        stream.destroy();
        unsubscribe();
      });
    });
  }

  private buildModel(): GaugeModel {
    const config = readGaugeConfig(this.currentObject());
    const member = this.member();
    const scale = resolveScale(config, member ?? undefined, this.limits);
    const points = this.stream()?.points() ?? [];
    const latest = points[points.length - 1] as WideDatum | undefined;
    const view = member ? this.metadata.getMetadata(member) : undefined;
    const range = view?.ranges()[0];
    const evaluation = latest && member ? this.limits.evaluate(latest, member) : undefined;
    const fraction = latest ? valueFraction(latest.value, scale) : 0;

    return {
      form: config.form,
      isDial: isDial(config.form),
      hasValue: latest !== undefined,
      value: latest && range ? formatField(latest, range, this.formats) : '—',
      unit: range?.unit ?? member?.telemetry?.unit ?? '',
      scale,
      fillPct: percent(latest?.value, scale),
      lowPct: scale.low !== undefined ? `${valueFraction(scale.low, scale) * 100}%` : null,
      highPct: scale.high !== undefined ? `${valueFraction(scale.high, scale) * 100}%` : null,
      limitState: limitStateClass(evaluation),
      stale: this.stale(),
      min: String(Math.round(scale.min * 100) / 100),
      max: String(Math.round(scale.max * 100) / 100),
      track: trackPath(),
      fill: fillPath(fraction),
      needle: needle(fraction),
    };
  }
}
