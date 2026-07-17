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
import { ViewDatumService } from '../datum-detail/view-datum.service';
import { formatField, limitCellClass } from '../tabular/telemetry-cell';

interface LadRow {
  keyString: string;
  name: string;
  timestamp: string;
  value: string;
  unit: string;
  limitClass: string;
  stale: boolean;
  datum: WideDatum | null;
}

/**
 * Latest-available-data table (OMCT-C08-L1-02): one row per composed telemetry
 * object showing its latest datum within the active bounds — seeded from a
 * historical request and kept current by a latest-strategy subscription — with
 * limit and staleness cell styling (OMCT-C08-L2-02.02).
 */
@Component({
  selector: 'cp-lad-table-view',
  standalone: true,
  templateUrl: './lad-table-view.component.html',
  styleUrl: './lad-table-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LadTableViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly limits = inject(LimitRegistry);
  private readonly staleness = inject(StalenessRegistry);
  private readonly formats = inject(ValueFormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);
  private readonly viewDatum = inject(ViewDatumService);

  readonly object = input.required<DomainObject>();
  readonly timeContext = input<TimeContext>();

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());
  private readonly staleMap = signal<Map<string, boolean>>(new Map());

  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly rows = computed<LadRow[]>(() => this.buildRows());

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
  }

  private buildRows(): LadRow[] {
    const streamMap = this.streams();
    const stale = this.staleMap();
    return this.members().map((member) => {
      const points = streamMap.get(member.keyString)?.points() ?? [];
      const latest = points[points.length - 1] as WideDatum | undefined;
      const view = this.metadata.getMetadata(member);
      const range = view?.ranges()[0];
      const domain = view?.domains()[0];
      const evaluation = latest ? this.limits.evaluate(latest, member) : undefined;
      return {
        keyString: member.keyString,
        name: member.name,
        timestamp: latest && domain ? formatField(latest, domain, this.formats) : '—',
        value: latest && range ? formatField(latest, range, this.formats) : '—',
        unit: range?.unit ?? member.telemetry?.unit ?? '',
        limitClass: limitCellClass(evaluation),
        stale: stale.get(member.keyString) ?? false,
        datum: latest ?? null,
      };
    });
  }

  protected onDatum(row: LadRow): void {
    const member = this.members().find((m) => m.keyString === row.keyString);
    if (member && row.datum) {
      this.viewDatum.open(member, row.datum);
    }
  }
}
