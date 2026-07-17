import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormatRegistry, SelectedItem, TimeContext } from '@cupola/core';

import { ExecutionStateService } from '../monitoring/execution-state.service';
import {
  ACTIVITY_STATE_OPTIONS,
  ActivityExecutionState,
} from '../monitoring/activity-states';
import { formatDuration } from '../time-list/temporal-class';
import { PlanActivitySelectionContext, isPlanActivitySelection } from './activity-selection';

interface DisplayProperty {
  key: string;
  value: string;
}

/**
 * Activity inspector (OMCT-C12-L2-01.04). Shows the selected activity's
 * formatted timing and configured display properties, plus an execution-state
 * select that persists through the shared activity-state object (04.02).
 */
@Component({
  selector: 'cp-activity-inspector-view',
  standalone: true,
  templateUrl: './activity-inspector-view.component.html',
  styleUrl: './activity-inspector-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'activity-inspector' },
})
export class ActivityInspectorViewComponent {
  private readonly formats = inject(FormatRegistry);
  private readonly time = inject(TimeContext);
  private readonly executionState = inject(ExecutionStateService);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly stateOptions = ACTIVITY_STATE_OPTIONS;
  protected readonly state = signal<ActivityExecutionState>('not-started');

  private readonly context = computed<PlanActivitySelectionContext | null>(() => {
    const first = this.selection()[0]?.context;
    return isPlanActivitySelection(first) ? first : null;
  });

  protected readonly activity = computed(() => this.context()?.activity ?? null);
  protected readonly planName = computed(() => this.context()?.plan.name ?? '');

  protected readonly startText = computed(() => this.formatTime(this.activity()?.start));
  protected readonly endText = computed(() => this.formatTime(this.activity()?.end));
  protected readonly durationText = computed(() => {
    const activity = this.activity();
    return activity ? formatDuration(activity.start, activity.end) : '';
  });
  protected readonly displayProperties = computed<DisplayProperty[]>(() => {
    const activity = this.activity();
    if (!activity) {
      return [];
    }
    return Object.entries(activity.displayProperties).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  });

  constructor() {
    effect(() => {
      const activity = this.activity();
      if (!activity) {
        return;
      }
      void this.loadState(activity.id);
    });
  }

  protected async onStateChange(value: string): Promise<void> {
    const activity = this.activity();
    if (!activity) {
      return;
    }
    const state = value as ActivityExecutionState;
    this.state.set(state);
    await this.executionState.setActivityState(activity.id, state);
  }

  private async loadState(activityId: string): Promise<void> {
    const stored = await this.executionState.getActivityState(activityId);
    this.state.set(stored ?? 'not-started');
  }

  private formatTime(value: number | undefined): string {
    if (value === undefined) {
      return '';
    }
    const format = this.formats.get(this.time.timeSystem().timeFormat);
    return format ? format.format(value) : new Date(value).toISOString();
  }
}
