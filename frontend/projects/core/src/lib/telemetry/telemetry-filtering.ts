import { TelemetryFilter } from '../models/telemetry-filter';
import { TelemetryValue } from '../models/telemetry-value';

/**
 * Filter evaluation applied by telemetry providers to historical results and
 * realtime emissions (B08, OMCT-C10-L2-04.03). Every active filter must match
 * (AND semantics); within one filter, any selected value may match.
 */
export function matchesFilters(datum: TelemetryValue, filters?: TelemetryFilter[]): boolean {
  if (!filters?.length) {
    return true;
  }
  const fields = datum as unknown as Record<string, unknown>;
  return filters.every((filter) => matchesFilter(fields[filter.key], filter));
}

/** Keeps only the datums matching every active filter. */
export function applyFilters(values: TelemetryValue[], filters?: TelemetryFilter[]): TelemetryValue[] {
  if (!filters?.length) {
    return values;
  }
  return values.filter((value) => matchesFilters(value, filters));
}

/**
 * Canonical serialization of an active filter set for subscription cache keys:
 * identical filters yield identical keys regardless of property or filter order,
 * and no filters yield the empty string so unfiltered keys stay unchanged.
 */
export function canonicalFilterKey(filters?: TelemetryFilter[]): string {
  if (!filters?.length) {
    return '';
  }
  const normalized = filters
    .map((filter) => ({ comparator: filter.comparator, key: filter.key, values: filter.values }))
    .sort((a, b) => (a.key + a.comparator).localeCompare(b.key + b.comparator));
  return JSON.stringify(normalized);
}

function matchesFilter(field: unknown, filter: TelemetryFilter): boolean {
  switch (filter.comparator) {
    case 'equals':
      return filter.values.some((value) => looselyEquals(field, value));
    case 'notEquals':
      return !filter.values.some((value) => looselyEquals(field, value));
    case 'contains':
      return (
        field != null &&
        filter.values.some((value) =>
          String(field).toLowerCase().includes(String(value).toLowerCase()),
        )
      );
  }
}

function looselyEquals(field: unknown, value: string | number): boolean {
  return field === value || String(field) === String(value);
}
