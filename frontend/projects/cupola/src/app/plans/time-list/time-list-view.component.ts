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
  ObjectApi,
  ObjectUpdatesService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { NowProvider } from '../plan/now-provider';
import { PlanActivity } from '../plan/plan-model';
import { normalizePlanObject } from '../plan/plan-normalizer';
import { filterActivities, TimeListFilter } from './activity-filter';
import { SortProperty, TimeListSort, sortActivities } from './activity-sorter';
import { TIME_LIST_FAMILY, readTimeListConfig } from './time-list-config';
import { TemporalClass, classifyTemporal, formatDuration, progressPercent } from './temporal-class';

/** SVG progress-arc circumference for r=6 (2·π·6). */
const ARC_CIRCUMFERENCE = 37.699;

type TimeClassOption = 'all' | 'past' | 'current-future';

interface RowModel {
  id: string;
  name: string;
  startText: string;
  endText: string;
  durationText: string;
  temporal: TemporalClass;
  isCurrent: boolean;
  isPast: boolean;
  percent: number;
  arcDash: string;
  statusLabel: string;
}

/**
 * Time list view (OMCT-C12-L1-03). Presents a composed plan's activities as a
 * sortable, filterable table, classifying each by temporal state with its
 * duration and progress (03.01–03.04). Filter and sort persist under
 * `configuration.timeList`.
 */
@Component({
  selector: 'cp-time-list-view',
  standalone: true,
  templateUrl: './time-list-view.component.html',
  styleUrl: './time-list-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'time-list', class: 'time-list-host' },
})
export class TimeListViewComponent {
  private readonly globalTime = inject(TimeContext);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly nowProvider = inject(NowProvider);
  private readonly formats = inject(FormatRegistry);
  private readonly viewConfig = inject(ViewConfigService);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  private readonly membersCtl = signal<CompositionMembers | null>(null);
  private readonly liveObject = signal<DomainObject | null>(null);
  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });

  protected readonly filter = signal<TimeListFilter>({});
  protected readonly sort = signal<TimeListSort>({ property: 'start', direction: 'asc' });
  protected readonly timeClass = signal<TimeClassOption>('all');

  private readonly members = computed(() => this.membersCtl()?.members() ?? []);
  private readonly plan = computed(() => this.members().find((member) => member.type === 'plan') ?? null);

  private readonly activities = computed<PlanActivity[]>(() => {
    const plan = this.plan();
    if (!plan) {
      return [];
    }
    return normalizePlanObject(plan).flatMap((group) => group.activities);
  });

  protected readonly rows = computed<RowModel[]>(() => {
    const now = this.nowProvider.now();
    const bounds = this.viewBounds();
    const sort = this.sort();
    const filtered = filterActivities(this.activities(), this.filter(), bounds, now);
    const ordered = sortActivities(filtered, sort.property, sort.direction);
    const formatTime = this.timeFormatter();
    return ordered.map((activity) => this.toRow(activity, now, formatTime));
  });

  private configLoaded = false;

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.contextValue();
      this.liveObject.set(object);

      if (!this.configLoaded) {
        this.configLoaded = true;
        const initial = readTimeListConfig(object);
        this.filter.set(initial.filter);
        this.sort.set(initial.sort);
        this.timeClass.set(this.classFromFilter(initial.filter));
      }

      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);

      const subs: Subscription[] = [];
      this.viewBounds.set(context.bounds());
      subs.push(context.boundsChanged().subscribe((bounds) => this.viewBounds.set(bounds)));
      subs.push(context.tick().subscribe(() => this.nowProvider.refresh()));
      subs.push(
        this.objectUpdates.forKeyString(object.keyString).subscribe((updated) => this.liveObject.set(updated)),
      );

      onCleanup(() => {
        subs.forEach((sub) => sub.unsubscribe());
        members.destroy();
      });
    });
  }

  protected sortBy(property: SortProperty): void {
    this.sort.update((current) => ({
      property,
      direction: current.property === property && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    void this.persist();
  }

  protected sortIndicator(property: SortProperty): '' | 'asc' | 'desc' {
    const sort = this.sort();
    return sort.property === property ? sort.direction : '';
  }

  protected onNameFilter(value: string): void {
    this.filter.update((current) => ({ ...current, name: value || undefined }));
    void this.persist();
  }

  protected onTimeClass(value: string): void {
    const option = value as TimeClassOption;
    this.timeClass.set(option);
    const temporalClasses =
      option === 'past' ? (['past'] as TemporalClass[]) : option === 'current-future' ? (['current', 'future'] as TemporalClass[]) : [];
    this.filter.update((current) => ({ ...current, temporalClasses }));
    void this.persist();
  }

  private async persist(): Promise<void> {
    const object = this.liveObject() ?? this.object();
    const saved = await this.viewConfig.write(object, TIME_LIST_FAMILY, {
      filter: this.filter(),
      sort: this.sort(),
    });
    this.liveObject.set(saved);
  }

  private toRow(activity: PlanActivity, now: number, formatTime: (value: number) => string): RowModel {
    const temporal = classifyTemporal(activity.start, activity.end, now);
    const percent = progressPercent(activity.start, activity.end, now);
    return {
      id: activity.id,
      name: activity.name,
      startText: formatTime(activity.start),
      endText: formatTime(activity.end),
      durationText: formatDuration(activity.start, activity.end),
      temporal,
      isCurrent: temporal === 'current',
      isPast: temporal === 'past',
      percent,
      arcDash: `${((percent / 100) * ARC_CIRCUMFERENCE).toFixed(1)} ${ARC_CIRCUMFERENCE.toFixed(1)}`,
      statusLabel: temporal === 'past' ? 'Complete' : temporal === 'current' ? `${percent}%` : 'Not started',
    };
  }

  private classFromFilter(filter: TimeListFilter): TimeClassOption {
    const classes = filter.temporalClasses ?? [];
    if (classes.length === 1 && classes[0] === 'past') {
      return 'past';
    }
    if (classes.length === 2 && classes.includes('current') && classes.includes('future')) {
      return 'current-future';
    }
    return 'all';
  }

  private contextValue(): TimeContext {
    return this.globalTime;
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.contextValue().timeSystem().timeFormat);
    return format
      ? (value) => format.format(value)
      : (value) => new Date(value).toISOString().slice(11, 19);
  }
}
