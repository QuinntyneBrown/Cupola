import { TimeBounds } from '@cupola/core';

import { PlanActivity } from '../plan/plan-model';
import { TemporalClass, classifyTemporal, isInProgress } from './temporal-class';

/** Time-list filter configuration (OMCT-C12-L2-03.02). */
export interface TimeListFilter {
  /** Case-insensitive substring match on the activity name. */
  name?: string;
  /** Case-insensitive substring match per configured metadata field. */
  metadata?: Record<string, string>;
  /** Temporal classes to include; empty/undefined includes all. */
  temporalClasses?: TemporalClass[];
}

/**
 * Whether an activity passes the active filters. In-progress activities are
 * always included, whatever the filters (OMCT-C12-L2-03.02).
 */
export function matchesFilter(
  activity: PlanActivity,
  filter: TimeListFilter,
  bounds: TimeBounds,
  now: number,
): boolean {
  if (isInProgress(activity.start, activity.end, now)) {
    return true;
  }

  if (filter.name && !activity.name.toLowerCase().includes(filter.name.toLowerCase())) {
    return false;
  }

  if (filter.metadata) {
    for (const [key, needle] of Object.entries(filter.metadata)) {
      if (!needle) {
        continue;
      }
      const value = String(activity.filterMetadata[key] ?? '').toLowerCase();
      if (!value.includes(needle.toLowerCase())) {
        return false;
      }
    }
  }

  if (filter.temporalClasses && filter.temporalClasses.length > 0) {
    const temporal = classifyTemporal(activity.start, activity.end, now);
    if (!filter.temporalClasses.includes(temporal)) {
      return false;
    }
  }

  // Active bounds: the activity must overlap the visible window.
  if (activity.end < bounds.start || activity.start > bounds.end) {
    return false;
  }

  return true;
}

/** Filters a list of activities by the active filters (OMCT-C12-L2-03.02). */
export function filterActivities(
  activities: PlanActivity[],
  filter: TimeListFilter,
  bounds: TimeBounds,
  now: number,
): PlanActivity[] {
  return activities.filter((activity) => matchesFilter(activity, filter, bounds, now));
}
