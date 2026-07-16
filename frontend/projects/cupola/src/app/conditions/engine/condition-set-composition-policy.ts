import { CompositionPolicy, DomainObject } from '@cupola/core';

/** Types that publish telemetry a condition set can evaluate. */
const TELEMETRY_PRODUCING_TYPES = new Set(['telemetry', 'derived-telemetry']);

/** True when the object publishes telemetry (carries metadata or is a telemetry type). */
export function producesTelemetry(object: DomainObject): boolean {
  return object.telemetry != null || TELEMETRY_PRODUCING_TYPES.has(object.type);
}

/**
 * Restricts condition-set composition to telemetry-producing children
 * (OMCT-C10-L2-01.01). Other parent types are unaffected.
 */
export class ConditionSetCompositionPolicy implements CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'condition-set') {
      return true;
    }
    return producesTelemetry(child);
  }
}
