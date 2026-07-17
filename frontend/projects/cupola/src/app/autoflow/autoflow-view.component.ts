import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { ViewDatumService } from '../datum-detail/view-datum.service';
import { formatField, limitCellClass } from '../tabular/telemetry-cell';

interface AutoflowRow {
  keyString: string;
  name: string;
  value: string;
  unit: string;
  limitClass: string;
  stale: boolean;
  datum: WideDatum | null;
}

/** Target column width; the view flows as many columns as the container allows. */
const COLUMN_WIDTH = 210;

/**
 * Autoflow tabular view (OMCT-C08-L1-04): one compact 24px row per composed
 * telemetry child (name + latest value), flowing into as many columns as the
 * container width allows via a {@link ResizeObserver} (OMCT-C08-L2-04.01). Values
 * carry limit and staleness styling (04.02) and rows follow composition (04.03).
 */
@Component({
  selector: 'cp-autoflow-view',
  standalone: true,
  templateUrl: './autoflow-view.component.html',
  styleUrl: './autoflow-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoflowViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly limits = inject(LimitRegistry);
  private readonly staleness = inject(StalenessRegistry);
  private readonly formats = inject(ValueFormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);
  private readonly viewDatum = inject(ViewDatumService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly object = input.required<DomainObject>();
  readonly timeContext = input<TimeContext>();

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());
  private readonly staleMap = signal<Map<string, boolean>>(new Map());
  protected readonly columns = signal(1);

  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly rows = computed<AutoflowRow[]>(() =>
    [...this.buildRows()].sort((a, b) => a.name.localeCompare(b.name)),
  );

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
      const unsubscribers: (() => void)[] = [];
      for (const member of members) {
        const stream = new TelemetryStream(member, this.telemetry, context);
        stream.start();
        streams.set(member.keyString, stream);
        unsubscribers.push(
          this.staleness.subscribe(member, (event) =>
            this.staleMap.update((map) => new Map(map).set(member.keyString, event.isStale)),
          ),
        );
      }
      this.streams.set(streams);
      onCleanup(() => {
        streams.forEach((stream) => stream.destroy());
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      });
    });

    // Reflow the rows across the columns the container width allows.
    const element = this.host.nativeElement;
    this.columns.set(this.columnsFor(element.clientWidth));
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? element.clientWidth;
        this.columns.set(this.columnsFor(width));
      });
      observer.observe(element);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  private columnsFor(width: number): number {
    return Math.max(1, Math.floor(width / COLUMN_WIDTH) || 1);
  }

  private buildRows(): AutoflowRow[] {
    const streamMap = this.streams();
    const stale = this.staleMap();
    return this.members().map((member) => {
      const points = streamMap.get(member.keyString)?.points() ?? [];
      const latest = points[points.length - 1] as WideDatum | undefined;
      const view = this.metadata.getMetadata(member);
      const range = view?.ranges()[0];
      const evaluation = latest ? this.limits.evaluate(latest, member) : undefined;
      return {
        keyString: member.keyString,
        name: member.name,
        value: latest && range ? formatField(latest, range, this.formats) : '—',
        unit: range?.unit ?? member.telemetry?.unit ?? '',
        limitClass: limitCellClass(evaluation),
        stale: stale.get(member.keyString) ?? false,
        datum: latest ?? null,
      };
    });
  }

  protected onDatum(row: AutoflowRow): void {
    const member = this.members().find((m) => m.keyString === row.keyString);
    if (member && row.datum) {
      this.viewDatum.open(member, row.datum);
    }
  }
}
