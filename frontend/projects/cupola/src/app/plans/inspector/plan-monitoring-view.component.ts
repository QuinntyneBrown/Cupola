import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomainObject, DurationFormat, SelectedItem } from '@cupola/core';

import { ExecutionStateService } from '../monitoring/execution-state.service';
import { PLAN_STATUS_OPTIONS, PlanMonitoringStatus } from '../monitoring/activity-states';

const duration = new DurationFormat();

/**
 * Plan execution-monitoring inspector (OMCT-C12-L2-04.04). For a selected plan,
 * edits the monitoring status and expected duration, persisted per plan key
 * through the shared monitoring object.
 */
@Component({
  selector: 'cp-plan-monitoring-view',
  standalone: true,
  templateUrl: './plan-monitoring-view.component.html',
  styleUrl: './plan-monitoring-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-testid': 'plan-monitoring-inspector' },
})
export class PlanMonitoringViewComponent {
  private readonly executionState = inject(ExecutionStateService);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly statusOptions = PLAN_STATUS_OPTIONS;
  protected readonly status = signal<PlanMonitoringStatus>('draft');
  protected readonly durationText = signal<string>('00:00:00');

  protected readonly plan = computed<DomainObject | null>(() => {
    const object = this.selection()[0]?.context.object;
    return object?.type === 'plan' ? object : null;
  });

  constructor() {
    effect(() => {
      const plan = this.plan();
      if (!plan) {
        return;
      }
      void this.load(plan.keyString);
    });
  }

  protected async onStatusChange(value: string): Promise<void> {
    const plan = this.plan();
    if (!plan) {
      return;
    }
    const status = value as PlanMonitoringStatus;
    this.status.set(status);
    await this.executionState.setPlanMonitoring(plan.keyString, { status });
  }

  protected async onDurationChange(value: string): Promise<void> {
    const plan = this.plan();
    if (!plan) {
      return;
    }
    this.durationText.set(value);
    if (!duration.validate(value)) {
      return;
    }
    await this.executionState.setPlanMonitoring(plan.keyString, { duration: duration.parse(value) });
  }

  private async load(planKey: string): Promise<void> {
    const entry = await this.executionState.getPlanMonitoring(planKey);
    this.status.set(entry?.status ?? 'draft');
    this.durationText.set(entry?.duration !== undefined ? duration.format(entry.duration) : '00:00:00');
  }
}
