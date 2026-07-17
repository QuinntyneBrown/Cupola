import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { numericRanges } from '../../views/plot/plot-eligibility';

/**
 * A bar graph accepts telemetry with at least one range and rejects condition sets
 * (OMCT-C07-L2-04.01).
 */
export class BarGraphCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'bar-graph') {
      return true;
    }
    if (child.type === 'condition-set') {
      return false;
    }
    return numericRanges(child, this.metadata).length >= 1;
  }
}
