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
  SelectionService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { CompositionMembers } from '../../telemetry-view/composition-members';
import { AxisTick, buildAxisTicks } from '../plan/axis';
import { NowProvider } from '../plan/now-provider';
import { PlanActivity, countActivities } from '../plan/plan-model';
import { LaidOutActivity, layoutPlan, slotVar } from '../plan/plan-layout';
import { normalizePlanObject } from '../plan/plan-normalizer';
import { createTimeScale } from '../plan/time-scale';
import { planActivitySelection } from '../inspector/activity-selection';

interface GanttBar extends LaidOutActivity {
  plan: DomainObject;
  slot: number;
}

interface GanttRow {
  bars: GanttBar[];
}

interface GanttPlan {
  keyString: string;
  name: string;
  activityCount: number;
  rows: GanttRow[];
}

/**
 * Gantt chart view (OMCT-C12-L2-01.05). Composes plan objects and renders each
 * as a header row (name · activity count) followed by its activity rows, all on
 * one shared time axis. Uses the same layout as the plan view.
 */
@Component({
  selector: 'cp-gantt-view',
  standalone: true,
  templateUrl: './gantt-view.component.html',
  styleUrl: './gantt-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'gantt-view', class: 'gantt-host' },
})
export class GanttViewComponent {
  private readonly globalTime = inject(TimeContext);
  private readonly objects = inject(ObjectApi);
  private readonly objectUpdates = inject(ObjectUpdatesService);
  private readonly selection = inject(SelectionService);
  private readonly nowProvider = inject(NowProvider);
  private readonly formats = inject(FormatRegistry);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();
  readonly restricted = input(false);

  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly selectedKey = signal<string | null>(null);
  private readonly membersCtl = signal<CompositionMembers | null>(null);

  protected readonly slotVar = slotVar;
  protected readonly members = computed(() => this.membersCtl()?.members() ?? []);

  protected readonly plans = computed<GanttPlan[]>(() => {
    const scale = createTimeScale(this.viewBounds());
    const now = this.nowProvider.now();
    return this.members()
      .filter((member) => member.type === 'plan')
      .map((plan) => {
        const groups = layoutPlan(normalizePlanObject(plan), scale, now);
        const rows: GanttRow[] = [];
        for (const group of groups) {
          for (let row = 0; row < group.rows; row += 1) {
            rows.push({
              bars: group.activities
                .filter((item) => item.row === row)
                .map((item) => ({ ...item, plan, slot: group.slot })),
            });
          }
        }
        return {
          keyString: plan.keyString,
          name: plan.name,
          activityCount: countActivities(normalizePlanObject(plan)),
          rows,
        };
      });
  });

  protected readonly axisTicks = computed<AxisTick[]>(() =>
    buildAxisTicks(this.viewBounds(), this.timeFormatter()),
  );

  constructor() {
    effect((onCleanup) => {
      const object = this.object();
      const context = this.context();
      const members = new CompositionMembers(object, this.objects, this.objectUpdates);
      members.start();
      this.membersCtl.set(members);

      const subs: Subscription[] = [];
      this.viewBounds.set(context.bounds());
      subs.push(context.boundsChanged().subscribe((bounds) => this.viewBounds.set(bounds)));
      subs.push(context.tick().subscribe(() => this.nowProvider.refresh()));

      onCleanup(() => {
        subs.forEach((sub) => sub.unsubscribe());
        members.destroy();
      });
    });

    effect((onCleanup) => {
      const sub = this.selection.changes.subscribe((items) => {
        this.selectedKey.set(items[0]?.context.key ?? null);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected isSelected(bar: GanttBar): boolean {
    return this.selectedKey() === `${bar.plan.keyString}:${bar.activity.id}`;
  }

  protected selectActivity(activity: PlanActivity, plan: DomainObject, event: Event): void {
    const element = event.currentTarget as HTMLElement;
    this.selection.select({ element, context: planActivitySelection(activity, plan) });
  }

  private context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.context().timeSystem().timeFormat);
    return format
      ? (value) => format.format(value)
      : (value) => new Date(value).toISOString().slice(11, 19);
  }
}
