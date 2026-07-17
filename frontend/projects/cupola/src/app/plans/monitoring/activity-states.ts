import { DomainObject } from '@cupola/core';

/** Fixed key/name of the shared activity-state object (OMCT-C12-L2-04.01). */
export const ACTIVITY_STATES_KEY = 'activity-states';
export const ACTIVITY_STATES_NAME = 'Activity States';
export const ACTIVITY_STATES_TYPE = 'activity-states';

/** Fixed key/name of the shared plan-monitoring object (OMCT-C12-L2-04.03). */
export const PLAN_MONITORING_KEY = 'plan-execution-monitoring';
export const PLAN_MONITORING_NAME = 'Plan Execution Monitoring';
export const PLAN_MONITORING_TYPE = 'plan-execution-monitoring';

/** Execution state persisted per activity identifier (OMCT-C12-L2-04.02). */
export type ActivityExecutionState = 'not-started' | 'in-progress' | 'completed' | 'aborted';

/** Monitoring status persisted per plan identifier (OMCT-C12-L2-04.04). */
export type PlanMonitoringStatus = 'draft' | 'active' | 'complete';

/** The activity-state object's configuration payload. */
export interface ActivityStatesConfiguration {
  activities: Record<string, ActivityExecutionState>;
}

/** One plan's monitoring entry: status plus an expected duration in ms. */
export interface PlanMonitoringEntry {
  status?: PlanMonitoringStatus;
  duration?: number;
}

/** The plan-monitoring object's configuration payload. */
export interface PlanMonitoringConfiguration {
  plans: Record<string, PlanMonitoringEntry>;
}

/** The default execution states shown for the activity-state select. */
export const ACTIVITY_STATE_OPTIONS: { value: ActivityExecutionState; label: string }[] = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'aborted', label: 'Aborted' },
];

/** The plan monitoring status options. */
export const PLAN_STATUS_OPTIONS: { value: PlanMonitoringStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
];

/**
 * The default activity-state root object returned when none is persisted
 * (OMCT-C12-L2-04.01). It carries no `persisted` stamp so the first save through
 * {@link ObjectApi} creates it in the store.
 */
export function activityStatesDefault(): DomainObject {
  return {
    identifier: { namespace: '', key: ACTIVITY_STATES_KEY },
    keyString: ACTIVITY_STATES_KEY,
    name: ACTIVITY_STATES_NAME,
    type: ACTIVITY_STATES_TYPE,
    location: 'ROOT',
    composition: [],
    configuration: { activities: {} } satisfies ActivityStatesConfiguration,
  };
}

/**
 * The default plan-execution-monitoring root object returned when none is
 * persisted (OMCT-C12-L2-04.03), with no `persisted` stamp.
 */
export function planMonitoringDefault(): DomainObject {
  return {
    identifier: { namespace: '', key: PLAN_MONITORING_KEY },
    keyString: PLAN_MONITORING_KEY,
    name: PLAN_MONITORING_NAME,
    type: PLAN_MONITORING_TYPE,
    location: 'ROOT',
    composition: [],
    configuration: { plans: {} } satisfies PlanMonitoringConfiguration,
  };
}

/** Reads the activities map from an activity-state object. */
export function readActivityStates(object: DomainObject): ActivityStatesConfiguration {
  const configuration = (object.configuration ?? {}) as Partial<ActivityStatesConfiguration>;
  return { activities: { ...(configuration.activities ?? {}) } };
}

/** Reads the plans map from a plan-monitoring object. */
export function readPlanMonitoring(object: DomainObject): PlanMonitoringConfiguration {
  const configuration = (object.configuration ?? {}) as Partial<PlanMonitoringConfiguration>;
  return { plans: { ...(configuration.plans ?? {}) } };
}
