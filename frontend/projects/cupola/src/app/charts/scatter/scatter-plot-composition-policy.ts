import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { numericRanges } from '../../views/plot/plot-eligibility';

/**
 * A scatter plot accepts a child only when its metadata supplies at least two
 * numeric ranges — one for each axis (OMCT-C07-L2-04.03).
 */
export class ScatterPlotCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'scatter-plot') {
      return true;
    }
    return numericRanges(child, this.metadata).length >= 2;
  }
}
