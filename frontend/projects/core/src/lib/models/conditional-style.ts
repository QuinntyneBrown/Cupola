/**
 * B09 — Conditional styles (contract).
 * Owner: C10 · Consumers: C09, C15 (inspector styles pane) · Stability: medium.
 *
 * Resolves open contract item #9 per OMCT-C10-L2-02.01/02.02: the visual properties a
 * conditional style may set and the binding from a condition set's active output to the
 * applied style. Style evaluation (the style rule manager) is C10-owned
 * (app/conditions/presentation/**), not part of the boundary.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

/** Visual properties a conditional style may set (OMCT-C10-L2-02.01). */
export interface StyleProperties {
  backgroundColor?: string;
  borderColor?: string;
  /** Text color. */
  color?: string;
  visibility?: 'visible' | 'hidden';
}

/** One style rule bound to a condition in the driving condition set. */
export interface ConditionalStyle {
  /** Condition (within the bound set) whose active output applies this style. */
  conditionId: string;
  style: StyleProperties;
}

/**
 * Persisted conditional-styling configuration for a stylable object or layout item,
 * stored under the object's `configuration.objectStyles` (OMCT-C10-L2-02.01; consumed by
 * C09 layout items and the C15 styles inspector pane).
 */
export interface ObjectStyleConfiguration {
  /** keyString of the condition set whose active output drives these styles. */
  conditionSetKeyString: string;
  /** Master switch: when false no conditional style applies; rules are retained. */
  enabled: boolean;
  styles: ConditionalStyle[];
  /** Applied when the set's default condition is active or no rule matches. */
  defaultStyle?: StyleProperties;
}
