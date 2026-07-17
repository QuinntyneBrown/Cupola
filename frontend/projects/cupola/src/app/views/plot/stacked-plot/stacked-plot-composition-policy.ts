import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { isRangeTelemetry } from '../plot-eligibility';

/**
 * A stacked plot accepts a range-telemetry object or an overlay plot as a row
 * (OMCT-C07-L2-01.04).
 */
export class StackedPlotCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'stacked-plot') {
      return true;
    }
    return child.type === 'overlay-plot' || isRangeTelemetry(child, this.metadata);
  }
}
