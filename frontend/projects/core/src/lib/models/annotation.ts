/**
 * B10 — Annotations (contract).
 * Owner: C13 · Consumers: C02 (search envelope), C11 (image annotations), C15 (inspector)
 * · Stability: high.
 *
 * Resolves open contract item #10: the typed annotation target schema. `targets` keeps the
 * original keyString list for wire compatibility; `targetDetails` carries per-target typed
 * detail (e.g. C11 image pixel coordinates ride in `detail`), and `annotationType` selects
 * the registered target comparator (OMCT-C13-L2-04.06).
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

/** A typed annotation target: the annotated object plus type-specific detail. */
export interface AnnotationTarget {
  /** keyString of the annotated object. */
  keyString: string;
  /** Type-specific payload, e.g. image pixel coordinates (OMCT-C11-L2-03.02/03.03). */
  detail?: Record<string, unknown>;
}

export interface Annotation {
  keyString: string;
  text: string;
  targets: string[];
  tags: string[];
  modified?: string;
  /** Registered annotation type; selects the target comparator (OMCT-C13-L2-04.01/04.06). */
  annotationType?: string;
  /** Typed detail per target, parallel to `targets` when present. */
  targetDetails?: AnnotationTarget[];
}
