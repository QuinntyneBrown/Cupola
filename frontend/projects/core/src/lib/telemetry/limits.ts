/**
 * B07 — Limits and staleness (contract).
 * Owner: C06 · Consumers: C07 (plot limit lines), C08 (table/gauge limit styling) · Stability: medium.
 *
 * Resolves open contract item #7: the limit-evaluation result shape and the staleness
 * event shape. Only the result shapes consumed across the boundary live here; the
 * `LimitProvider`/`StalenessProvider` interfaces and registries are C06-owned engine
 * (core/src/lib/telemetry/**). See docs/capability-contracts/cross-capability-contracts.md.
 */

/** Low/high threshold pair for a single limit level. */
export interface LimitRange {
  low?: number;
  high?: number;
}

/** A named limit level with its threshold range and presentation hint. */
export interface LimitDefinition {
  level: string; // level key, e.g. 'critical' | 'warning'
  name?: string;
  cssClass?: string;
  range: LimitRange;
}

/**
 * The evaluation of a datum against a provider's limits (OMCT-C06-L2-04.03).
 * `level` is absent-by-omission when the datum is within all limits.
 */
export interface LimitEvaluation {
  level: string;
  name?: string;
  cssClass?: string; // style hint applied by C07/C08 views
  low?: number;
  high?: number;
}

/** A staleness state change for a telemetry object (OMCT-C06-L2-04.04). */
export interface StalenessEvent {
  keyString: string;
  isStale: boolean;
  timestamp: string; // ISO 8601
}
