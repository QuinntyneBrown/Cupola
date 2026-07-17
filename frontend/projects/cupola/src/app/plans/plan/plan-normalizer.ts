import { DomainObject } from '@cupola/core';

import { PlanActivity, PlanActivityGroup, PlanConfiguration, PlanSourceMap } from './plan-model';

type RawActivity = Record<string, unknown>;

/** Core activity fields that are never treated as extra display properties. */
const CORE_FIELDS = new Set(['id', 'name', 'start', 'end']);

/** Coerces a raw start/end value (epoch ms or ISO string) to epoch milliseconds. */
function toEpoch(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? Number.NaN : numeric;
  }
  return Number.NaN;
}

/** Selects the named keys from a raw activity, skipping absent ones. */
function pick(source: RawActivity, keys: string[] | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys ?? []) {
    if (key in source && source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
}

/** Every non-core field, used as the default display/filter metadata. */
function extraFields(source: RawActivity): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!CORE_FIELDS.has(key) && value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function fallbackId(groupName: string, index: number): string {
  return `${groupName}::${index}`;
}

/** Normalizes the standard upstream shape `{ "Group": [{ name, start, end, type }] }`. */
function normalizeStandard(planData: Record<string, unknown>): PlanActivityGroup[] {
  const groups: PlanActivityGroup[] = [];
  for (const [groupName, rawActivities] of Object.entries(planData)) {
    if (!Array.isArray(rawActivities)) {
      continue;
    }
    const activities = rawActivities.map((entry, index): PlanActivity => {
      const raw = (entry ?? {}) as RawActivity;
      const extras = extraFields(raw);
      return {
        id: typeof raw['id'] === 'string' ? (raw['id'] as string) : fallbackId(groupName, index),
        name: String(raw['name'] ?? ''),
        start: toEpoch(raw['start']),
        end: toEpoch(raw['end']),
        groupName,
        type: raw['type'] != null ? String(raw['type']) : groupName,
        displayProperties: extras,
        filterMetadata: extras,
      };
    });
    groups.push({ name: groupName, activities });
  }
  return groups;
}

/** Normalizes a source-mapped flat activities array into groups. */
function normalizeSourceMapped(planData: unknown, sourceMap: PlanSourceMap): PlanActivityGroup[] {
  const container = (planData ?? {}) as Record<string, unknown>;
  const rawActivities = container[sourceMap.activities];
  if (!Array.isArray(rawActivities)) {
    return [];
  }

  const byGroup = new Map<string, PlanActivity[]>();
  const order: string[] = [];
  rawActivities.forEach((entry, index) => {
    const raw = (entry ?? {}) as RawActivity;
    const groupName = String(raw[sourceMap.groupId] ?? 'Ungrouped');
    const id = raw[sourceMap.id] != null ? String(raw[sourceMap.id]) : fallbackId(groupName, index);
    const activity: PlanActivity = {
      id,
      name: String(raw['name'] ?? raw[sourceMap.id] ?? id),
      start: toEpoch(raw[sourceMap.start]),
      end: toEpoch(raw[sourceMap.end]),
      groupName,
      type: groupName,
      displayProperties: pick(raw, sourceMap.displayProperties),
      filterMetadata: pick(raw, sourceMap.filterMetadata),
    };
    if (!byGroup.has(groupName)) {
      byGroup.set(groupName, []);
      order.push(groupName);
    }
    byGroup.get(groupName)!.push(activity);
  });

  return order.map((name) => ({ name, activities: byGroup.get(name)! }));
}

/**
 * Normalizes plan data — standard or source-mapped — into activity groups for
 * rendering (OMCT-C12-L2-01.01). Pure: no I/O, deterministic ordering.
 */
export function normalizePlan(planData: unknown, sourceMap?: PlanSourceMap): PlanActivityGroup[] {
  if (planData == null || typeof planData !== 'object') {
    return [];
  }
  if (sourceMap) {
    return normalizeSourceMapped(planData, sourceMap);
  }
  return normalizeStandard(planData as Record<string, unknown>);
}

/** Reads the plan configuration from a domain object. */
export function readPlanConfiguration(object: DomainObject): PlanConfiguration {
  const configuration = (object.configuration ?? {}) as Record<string, unknown>;
  return {
    planData: configuration['planData'],
    sourceMap: configuration['sourceMap'] as PlanSourceMap | undefined,
  };
}

/** Normalizes the plan carried by a domain object's configuration. */
export function normalizePlanObject(object: DomainObject): PlanActivityGroup[] {
  const { planData, sourceMap } = readPlanConfiguration(object);
  return normalizePlan(planData, sourceMap);
}
