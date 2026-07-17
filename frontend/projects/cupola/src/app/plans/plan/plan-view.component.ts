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
  SelectionService,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { AxisTick, buildAxisTicks } from './axis';
import { NowProvider } from './now-provider';
import { normalizePlanObject } from './plan-normalizer';
import { LaidOutGroup, layoutPlan, slotVar } from './plan-layout';
import { createTimeScale } from './time-scale';
import { planActivitySelection } from '../inspector/activity-selection';
import { PlanActivity } from './plan-model';

/**
 * Plan view (OMCT-C12-L1-01). Renders a plan's activity groups as swimlanes,
 * positioning each activity by start/end on the active time scale and stacking
 * overlapping activities onto separate rows. Selecting an activity publishes it
 * for the inspector. As a time-strip child (B11) it follows the supplied
 * {@link TimeContext} and, when restricted, drops its own axis and gutters so
 * its bars align edge-to-edge with the strip's shared axis.
 */
@Component({
  selector: 'cp-plan-view',
  standalone: true,
  templateUrl: './plan-view.component.html',
  styleUrl: './plan-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'plan-view', class: 'plan-host' },
})
export class PlanViewComponent {
  private readonly globalTime = inject(TimeContext);
  private readonly selection = inject(SelectionService);
  private readonly nowProvider = inject(NowProvider);
  private readonly formats = inject(FormatRegistry);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);
  readonly timeContext = input<TimeContext>();
  readonly restricted = input(false);

  private readonly viewBounds = signal<TimeBounds>({ start: 0, end: 0 });
  private readonly selectedKey = signal<string | null>(null);

  private readonly groups = computed(() => normalizePlanObject(this.object()));
  protected readonly slotVar = slotVar;

  protected readonly model = computed<LaidOutGroup[]>(() => {
    const scale = createTimeScale(this.viewBounds());
    return layoutPlan(this.groups(), scale, this.nowProvider.now());
  });

  protected readonly axisTicks = computed<AxisTick[]>(() => this.buildAxisTicks());
  protected readonly nowPct = computed<number | null>(() => {
    const bounds = this.viewBounds();
    const now = this.nowProvider.now();
    if (now < bounds.start || now > bounds.end || bounds.end <= bounds.start) {
      return null;
    }
    return createTimeScale(bounds).offset(now);
  });

  constructor() {
    effect((onCleanup) => {
      const context = this.context();
      const subs: Subscription[] = [];
      this.viewBounds.set(context.bounds());
      subs.push(context.boundsChanged().subscribe((bounds) => this.viewBounds.set(bounds)));
      subs.push(context.tick().subscribe(() => this.nowProvider.refresh()));
      onCleanup(() => subs.forEach((sub) => sub.unsubscribe()));
    });

    effect((onCleanup) => {
      const sub = this.selection.changes.subscribe((items) => {
        const context = items[0]?.context;
        this.selectedKey.set(context ? (context.key ?? null) : null);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected isSelected(activity: PlanActivity): boolean {
    return this.selectedKey() === `${this.object().keyString}:${activity.id}`;
  }

  protected selectActivity(activity: PlanActivity, event: Event): void {
    const element = event.currentTarget as HTMLElement;
    this.selection.select({ element, context: planActivitySelection(activity, this.object()) });
  }

  private context(): TimeContext {
    return this.timeContext() ?? this.globalTime;
  }

  private buildAxisTicks(): AxisTick[] {
    return buildAxisTicks(this.viewBounds(), this.timeFormatter());
  }

  private timeFormatter(): (value: number) => string {
    const format = this.formats.get(this.context().timeSystem().timeFormat);
    return format
      ? (value) => format.format(value)
      : (value) => new Date(value).toISOString().slice(11, 19);
  }
}
