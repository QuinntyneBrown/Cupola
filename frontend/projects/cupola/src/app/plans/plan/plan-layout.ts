import { PlanActivity, PlanActivityGroup } from './plan-model';
import { allocateRows, RowItem, rowCount } from './row-allocator';
import { TimeScale } from './time-scale';
import { TemporalClass, classifyTemporal } from '../time-list/temporal-class';

/** One activity positioned on a time scale and assigned a row. */
export interface LaidOutActivity {
  activity: PlanActivity;
  /** Left edge as a percentage of the track width (clamped to 0–100). */
  leftPct: number;
  /** Width as a percentage of the track width (clamped). */
  widthPct: number;
  /** Zero-based row within its group. */
  row: number;
  temporal: TemporalClass;
}

/** One group's laid-out activities plus its palette slot and row count. */
export interface LaidOutGroup {
  name: string;
  /** 1-based chart palette slot (`var(--cp-chart-N)`). */
  slot: number;
  rows: number;
  /** `[0, 1, …, rows-1]`, for template iteration over rows. */
  rowIndices: number[];
  activities: LaidOutActivity[];
}

/** Returns `var(--cp-chart-N)` for a 1-based slot, cycling 1–8. */
export function slotVar(slot: number): string {
  const index = ((Math.max(1, Math.round(slot)) - 1) % 8) + 1;
  return `var(--cp-chart-${index})`;
}

/** Lays out one group: assigns rows over raw positions, renders clamped bars. */
export function layoutGroup(
  group: PlanActivityGroup,
  groupIndex: number,
  scale: TimeScale,
  now: number,
): LaidOutGroup {
  const items: RowItem[] = group.activities.map((activity) => ({
    startPct: scale.offset(activity.start),
    endPct: scale.offset(activity.end),
    labelLength: activity.name.length,
  }));
  const assignments = allocateRows(items);
  const activities = group.activities.map((activity, index): LaidOutActivity => ({
    activity,
    leftPct: scale.clampedOffset(activity.start),
    widthPct: scale.width(activity.start, activity.end),
    row: assignments[index],
    temporal: classifyTemporal(activity.start, activity.end, now),
  }));
  const rows = rowCount(assignments);
  return {
    name: group.name,
    slot: groupIndex + 1,
    rows,
    rowIndices: Array.from({ length: rows }, (_, index) => index),
    activities,
  };
}

/** Lays out every group of a plan against the shared scale. */
export function layoutPlan(
  groups: PlanActivityGroup[],
  scale: TimeScale,
  now: number,
): LaidOutGroup[] {
  return groups.map((group, index) => layoutGroup(group, index, scale, now));
}
