import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { isRangeTelemetry } from './plot-eligibility';

/** An overlay plot accepts only numeric-range telemetry as a series (OMCT-C07-L2-01.03). */
export class OverlayPlotCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'overlay-plot') {
      return true;
    }
    return isRangeTelemetry(child, this.metadata);
  }
}
