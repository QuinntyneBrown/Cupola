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
  LimitRegistry,
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeContext,
  ValueFormatRegistry,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { PauseController } from '../../telemetry-view/pause-controller';
import { TelemetryStream, WideDatum } from '../../telemetry-view/telemetry-stream';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { ViewDatumService } from '../../datum-detail/view-datum.service';
import { formatField, limitCellClass } from '../../tabular/telemetry-cell';
import { CsvExportService } from './csv-export.service';
import { ColumnMenuComponent } from './column-menu.component';
import { TableColumn, deriveColumns } from './table-columns';
import {
  TABLE_CONFIG_FAMILY,
  TableConfiguration,
  cycleSort,
  moveColumn,
  orderedVisibleColumns,
  readTableConfig,
  toggleColumn,
} from './table-config';
import { TableRow, filterRows, rowId, sortRows } from './table-rows';

type PauseSource = 'mark' | 'manual' | null;

/**
 * Telemetry table view (OMCT-C08-L1-01). Renders one row per datum across the
 * composed telemetry members with one column per metadata value, driven by the
 * shared telemetry-view foundation: a historical request per member for the
 * active bounds plus a realtime subscription. Realtime datums replace a logical
 * row in place by the configured update key; marking a row or pressing pause
 * freezes realtime motion; a conductor bounds change clears marks and refreshes.
 */
@Component({
  selector: 'cp-table-view',
  standalone: true,
  imports: [ColumnMenuComponent],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableViewComponent {
  private readonly telemetry = inject(TelemetryApiService);
  private readonly metadata = inject(MetadataRegistry);
  private readonly limits = inject(LimitRegistry);
  private readonly formats = inject(ValueFormatRegistry);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly globalTime = inject(TimeContext);
  private readonly viewConfig = inject(ViewConfigService);
  private readonly csvExport = inject(CsvExportService);
  private readonly viewDatum = inject(ViewDatumService);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();

  protected readonly pause = new PauseController();
  protected readonly filters = signal<Record<string, string>>({});
  protected readonly marked = signal<Set<string>>(new Set());
  protected readonly menuOpen = signal(false);
  protected readonly exportMenuOpen = signal(false);

  private readonly liveObject = signal<DomainObject | null>(null);
  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly streams = signal<Map<string, TelemetryStream>>(new Map());
  private readonly frozen = signal<TableRow[] | null>(null);
  private pauseSource: PauseSource = null;
  private lastKey: string | null = null;

  protected readonly currentObject = computed(() => this.liveObject() ?? this.object());
  protected readonly config = computed<TableConfiguration>(() => readTableConfig(this.currentObject()));
  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);
  protected readonly derivedColumns = computed<TableColumn[]>(() =>
    deriveColumns(this.members(), this.metadata),
  );
  protected readonly columns = computed<TableColumn[]>(() =>
    orderedVisibleColumns(this.derivedColumns(), this.config()),
  );
  protected readonly loading = computed(() =>
    [...this.streams().values()].some((stream) => stream.loading()),
  );

  /** All logical rows (live buffer, or the frozen snapshot while paused). */
  private readonly sourceRows = computed<TableRow[]>(() => this.frozen() ?? this.buildRows());
  protected readonly visibleRows = computed<TableRow[]>(() =>
    sortRows(filterRows(this.sourceRows(), this.filters()), this.config().sort),
  );
  protected readonly markedCount = computed(() => this.marked().size);

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.context();
      const subs: Subscription[] = [];

      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);

      if (this.lastKey !== object.keyString) {
        this.lastKey = object.keyString;
        this.resume();
        this.marked.set(new Set());
        this.filters.set({});
      }

      subs.push(
        context.boundsChanged().subscribe((bounds) => {
          // A user-originated bounds change clears marks/pause and refreshes for
          // the new window (OMCT-C08-L2-01.07).
          this.marked.set(new Set());
          this.resume();
          for (const stream of this.streams().values()) {
            stream.setFollowing(true);
            void stream.reload(bounds);
          }
        }),
      );
      subs.push(
        this.objectUpdates
          .forKeyString(object.keyString)
          .subscribe((updated) => this.liveObject.set(updated)),
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

  private buildRows(): TableRow[] {
    const columns = this.derivedColumns();
    const updateKey = this.config().updateKey;
    const byId = new Map<string, TableRow>();
    for (const member of this.members()) {
      const view = this.metadata.getMetadata(member);
      const points = this.streams().get(member.keyString)?.points() ?? [];
      for (const datum of points) {
        const cells: Record<string, string> = {};
        for (const column of columns) {
          cells[column.key] =
            column.key === 'name' ? member.name : formatField(datum, view?.value(column.key), this.formats);
        }
        const evaluation = this.limits.evaluate(datum, member);
        const id = rowId(member.keyString, updateKey, datum);
        byId.set(id, {
          id,
          memberKey: member.keyString,
          memberName: member.name,
          cells,
          limitClass: limitCellClass(evaluation),
          datum: datum as WideDatum,
        });
      }
    }
    return [...byId.values()];
  }

  // --- Interactions ---

  protected isMarked(row: TableRow): boolean {
    return this.marked().has(row.id);
  }

  protected toggleMark(row: TableRow): void {
    const next = new Set(this.marked());
    if (next.has(row.id)) {
      next.delete(row.id);
    } else {
      next.add(row.id);
    }
    this.marked.set(next);
    if (next.size > 0) {
      this.doPause('mark');
    } else if (this.pauseSource === 'mark') {
      this.resume();
    }
  }

  protected togglePause(): void {
    if (this.pause.isPaused()) {
      this.resume();
    } else {
      this.doPause('manual');
    }
  }

  private doPause(source: PauseSource): void {
    if (!this.pause.isPaused()) {
      this.frozen.set(this.buildRows());
      this.pause.pause();
      for (const stream of this.streams().values()) {
        stream.setFollowing(false);
      }
    }
    this.pauseSource = source;
  }

  private resume(): void {
    this.pause.resume();
    this.pauseSource = null;
    this.frozen.set(null);
    for (const stream of this.streams().values()) {
      stream.setFollowing(true);
    }
  }

  protected setFilter(key: string, event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.filters.update((filters) => ({ ...filters, [key]: term }));
  }

  protected onSort(column: TableColumn): void {
    void this.persist(cycleSort(this.config(), column.key));
  }

  protected sortIndicator(column: TableColumn): 'asc' | 'desc' | null {
    const sort = this.config().sort;
    return sort?.key === column.key ? sort.direction : null;
  }

  protected onDatum(row: TableRow): void {
    const member = this.members().find((m) => m.keyString === row.memberKey) ?? this.currentObject();
    this.viewDatum.open(member, row.datum);
  }

  // --- Column configuration menu (OMCT-C08-L2-01.04) ---

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.exportMenuOpen.set(false);
  }

  protected onToggleColumn(key: string): void {
    void this.persist(toggleColumn(this.config(), this.derivedColumns(), key));
  }

  protected onMoveColumn(change: { key: string; direction: 'up' | 'down' }): void {
    void this.persist(moveColumn(this.config(), this.derivedColumns(), change.key, change.direction));
  }

  // --- CSV export (OMCT-C08-L2-01.08) ---

  protected toggleExportMenu(): void {
    this.exportMenuOpen.update((open) => !open);
    this.menuOpen.set(false);
  }

  protected exportAll(): void {
    this.csvExport.download(this.currentObject(), this.columns(), this.sourceRows());
    this.exportMenuOpen.set(false);
  }

  protected exportMarked(): void {
    if (this.markedCount() === 0) {
      return;
    }
    const marked = this.sourceRows().filter((row) => this.marked().has(row.id));
    this.csvExport.download(this.currentObject(), this.columns(), marked);
    this.exportMenuOpen.set(false);
  }

  private async persist(config: TableConfiguration): Promise<void> {
    const object = this.currentObject();
    const optimistic: DomainObject = {
      ...object,
      configuration: { ...object.configuration, [TABLE_CONFIG_FAMILY]: JSON.parse(JSON.stringify(config)) },
    };
    this.liveObject.set(optimistic);
    const saved = await this.viewConfig.write(object, TABLE_CONFIG_FAMILY, config);
    this.liveObject.set(saved);
    this.objectUpdates.emitLocal(saved);
  }
}
