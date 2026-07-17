import { PlanActivity } from '../plan/plan-model';

/** Sortable time-list properties (OMCT-C12-L2-03.03). */
export type SortProperty = 'name' | 'start' | 'end' | 'duration';
export type SortDirection = 'asc' | 'desc';

/** Time-list sort configuration. */
export interface TimeListSort {
  property: SortProperty;
  direction: SortDirection;
}

function compare(a: PlanActivity, b: PlanActivity, property: SortProperty): number {
  switch (property) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'end':
      return a.end - b.end;
    case 'duration':
      return a.end - a.start - (b.end - b.start);
    case 'start':
    default:
      return a.start - b.start;
  }
}

/**
 * Orders activities by a supported property and direction (OMCT-C12-L2-03.03).
 * Stable for the chosen property; returns a new array.
 */
export function sortActivities(
  activities: PlanActivity[],
  property: SortProperty,
  direction: SortDirection,
): PlanActivity[] {
  const factor = direction === 'desc' ? -1 : 1;
  return [...activities].sort((a, b) => factor * compare(a, b, property));
}
