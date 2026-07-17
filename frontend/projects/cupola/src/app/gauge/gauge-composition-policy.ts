import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { isRangeTelemetry } from '../views/plot/plot-eligibility';

/**
 * A gauge accepts a single numeric-range telemetry source (OMCT-C08-L2-03.02):
 * the child must produce a numeric range, and the gauge holds at most one member.
 */
export class GaugeCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'gauge') {
      return true;
    }
    if (!isRangeTelemetry(child, this.metadata)) {
      return false;
    }
    return (parent.composition?.length ?? 0) === 0;
  }
}
