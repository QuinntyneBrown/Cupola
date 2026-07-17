import { DomainObject, SelectionContext } from '@cupola/core';

import { PlanActivity } from '../plan/plan-model';

/** Discriminator for a selected plan activity. */
export const PLAN_ACTIVITY_SELECTION = 'plan-activity';

/**
 * Selection context published when an operator picks a plan activity. Carries
 * the activity and its owning plan so inspector views can render timing and
 * display properties and persist execution state (OMCT-C12-L2-01.04, 04.02).
 */
export interface PlanActivitySelectionContext extends SelectionContext {
  type: typeof PLAN_ACTIVITY_SELECTION;
  activity: PlanActivity;
  plan: DomainObject;
}

/** Builds a selection context for a plan activity. */
export function planActivitySelection(
  activity: PlanActivity,
  plan: DomainObject,
): PlanActivitySelectionContext {
  return {
    key: `${plan.keyString}:${activity.id}`,
    label: activity.name,
    // Carry the plan as the selected object so the plan-monitoring inspector
    // also applies while an activity is selected (mock: Activity + Execution +
    // Plan monitoring panels together).
    object: plan,
    type: PLAN_ACTIVITY_SELECTION,
    activity,
    plan,
  };
}

/** Narrows a selection context to a plan-activity selection. */
export function isPlanActivitySelection(
  context: SelectionContext | undefined,
): context is PlanActivitySelectionContext {
  return context?.type === PLAN_ACTIVITY_SELECTION;
}
