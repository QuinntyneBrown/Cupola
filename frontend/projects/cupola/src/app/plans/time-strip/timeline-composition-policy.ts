import { CompositionPolicy, DomainObject, MetadataRegistry } from '@cupola/core';

import { isTimeStripEligible } from './strip-eligibility';

/**
 * Time strips accept compatible time-based children — plans, gantt charts,
 * plots, range telemetry, image telemetry, and domain-only (event) telemetry —
 * and reject incompatible objects such as folders (OMCT-C12-L2-02.01). Other
 * parent types are not constrained.
 */
export class TimelineCompositionPolicy implements CompositionPolicy {
  constructor(private readonly metadata: MetadataRegistry) {}

  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'time-strip') {
      return true;
    }
    return isTimeStripEligible(child, this.metadata);
  }
}
