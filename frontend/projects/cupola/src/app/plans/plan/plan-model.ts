/**
 * Normalized plan data model (OMCT-C12-L2-01.01). A plan is a set of named
 * activity groups, each rendered as one swimlane; every activity carries its
 * timing plus the display and filter metadata configured for it.
 */

/** A single scheduled activity within a plan, normalized for rendering. */
export interface PlanActivity {
  /** Stable identity used for selection and execution-state keying. */
  id: string;
  name: string;
  /** Start time in epoch milliseconds. */
  start: number;
  /** End time in epoch milliseconds. */
  end: number;
  /** The name of the group (swimlane) this activity belongs to. */
  groupName: string;
  /** Optional activity category / type. */
  type?: string;
  /** Configured display properties surfaced in the inspector. */
  displayProperties: Record<string, unknown>;
  /** Fields available for time-list filtering. */
  filterMetadata: Record<string, unknown>;
}

/** A named group of activities rendered as one swimlane. */
export interface PlanActivityGroup {
  name: string;
  activities: PlanActivity[];
}

/**
 * Optional source map naming the raw fields to read for each concept
 * (OMCT-C12-L2-01.01): activities, group, start, end, identity, display, and
 * filter. When absent, the standard upstream shape
 * `{ "Group": [{ name, start, end, type }] }` is assumed.
 */
export interface PlanSourceMap {
  /** Property on the raw data holding the flat activities array. */
  activities: string;
  /** Field on each activity naming its group. */
  groupId: string;
  /** Field holding the start time. */
  start: string;
  /** Field holding the end time. */
  end: string;
  /** Field holding the activity identity. */
  id: string;
  /** Fields surfaced as inspector display properties. */
  displayProperties?: string[];
  /** Fields available for time-list filtering. */
  filterMetadata?: string[];
}

/** The persisted plan configuration read from `configuration`. */
export interface PlanConfiguration {
  planData?: unknown;
  sourceMap?: PlanSourceMap;
}

/** Total activity count across every group. */
export function countActivities(groups: PlanActivityGroup[]): number {
  return groups.reduce((total, group) => total + group.activities.length, 0);
}
