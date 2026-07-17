import { Injectable, inject } from '@angular/core';
import { DomainObject, ObjectApi } from '@cupola/core';

import {
  ACTIVITY_STATES_KEY,
  ActivityExecutionState,
  ActivityStatesConfiguration,
  PLAN_MONITORING_KEY,
  PlanMonitoringConfiguration,
  PlanMonitoringEntry,
  readActivityStates,
  readPlanMonitoring,
} from './activity-states';

/**
 * Reads and persists execution-monitoring state through the shared domain
 * objects (OMCT-C12-L2-04.02, 04.04). Each write is get → merge the entry →
 * save, with a single re-get-and-reapply retry on an optimistic-concurrency
 * conflict. `ObjectUpdated` propagation to other views is handled by the save
 * broadcast.
 */
@Injectable({ providedIn: 'root' })
export class ExecutionStateService {
  private readonly objects = inject(ObjectApi);

  /** The current execution state for an activity, if any. */
  async getActivityState(activityId: string): Promise<ActivityExecutionState | undefined> {
    const object = await this.objects.get(ACTIVITY_STATES_KEY);
    return readActivityStates(object).activities[activityId];
  }

  /** Persists the execution state for an activity by identifier. */
  setActivityState(activityId: string, state: ActivityExecutionState): Promise<DomainObject> {
    return this.mutate(ACTIVITY_STATES_KEY, (object) => {
      const config = readActivityStates(object);
      config.activities[activityId] = state;
      return withConfiguration(object, { activities: config.activities } satisfies ActivityStatesConfiguration);
    });
  }

  /** The current monitoring entry for a plan, if any. */
  async getPlanMonitoring(planKey: string): Promise<PlanMonitoringEntry | undefined> {
    const object = await this.objects.get(PLAN_MONITORING_KEY);
    return readPlanMonitoring(object).plans[planKey];
  }

  /** Persists (merges) the monitoring status and/or duration for a plan by identifier. */
  setPlanMonitoring(planKey: string, entry: PlanMonitoringEntry): Promise<DomainObject> {
    return this.mutate(PLAN_MONITORING_KEY, (object) => {
      const config = readPlanMonitoring(object);
      config.plans[planKey] = { ...config.plans[planKey], ...entry };
      return withConfiguration(object, { plans: config.plans } satisfies PlanMonitoringConfiguration);
    });
  }

  private async mutate(
    keyString: string,
    apply: (object: DomainObject) => DomainObject,
  ): Promise<DomainObject> {
    const object = await this.objects.get(keyString);
    const updated = apply(object);
    const result = await this.objects.save(updated);
    if (result.outcome !== 'conflict') {
      return result.object ?? updated;
    }
    // One retry: re-read the current server state and re-apply the merge.
    const current = result.object ?? (await this.objects.get(keyString));
    const retried = apply(current);
    const retry = await this.objects.save(retried);
    return retry.object ?? retried;
  }
}

/** Returns a copy of the object with its configuration replaced by `value`. */
function withConfiguration(object: DomainObject, value: Record<string, unknown>): DomainObject {
  return { ...object, configuration: { ...object.configuration, ...value } };
}
