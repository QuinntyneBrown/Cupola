/**
 * B08 — Telemetry filters (contract).
 * Owner: C10 · Consumers: C06 (request options), C07, C08 · Stability: medium.
 *
 * Resolves open contract item #8: the filter definition schema declared by telemetry
 * metadata and the active-filter shape carried in request/subscription options
 * (OMCT-C10-L2-04.01–04.03). Filter persistence and the filter inspector are C10-owned
 * (app/conditions/filters/**), not part of the boundary.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

/** Comparison a telemetry provider applies when filtering a datum field. */
export type TelemetryFilterComparator = 'equals' | 'notEquals' | 'contains';

/**
 * An active filter carried in request and subscription provider options
 * (OMCT-C10-L2-04.03).
 */
export interface TelemetryFilter {
  /** Datum field the filter constrains (a telemetry metadata value key, e.g. 'value'). */
  key: string;
  comparator: TelemetryFilterComparator;
  /** Selected values; a single element for radio/text filters, one per checked box otherwise. */
  values: (string | number)[];
}

/** Choice offered by an enumerated filter definition. */
export interface TelemetryFilterValue {
  label: string;
  value: string | number;
}

/**
 * Metadata-declared filter definition driving the filter inspector controls
 * (OMCT-C10-L2-04.01): a radio group when `singleSelection` with `possibleValues`,
 * checkboxes for multi-selection `possibleValues`, and a free-text input otherwise.
 */
export interface TelemetryFilterDefinition {
  key: string;
  name?: string;
  comparator: TelemetryFilterComparator;
  possibleValues?: TelemetryFilterValue[];
  /** One selection at a time (radio) instead of checkboxes. */
  singleSelection?: boolean;
}
