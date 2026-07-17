import { CompositionPolicy, DomainObject } from '@cupola/core';

import { producesTelemetry } from '../lad/lad-composition-policy';

/** An autoflow view accepts only telemetry-producing children (OMCT-C08-L2-04.01). */
export class AutoflowCompositionPolicy implements CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'autoflow') {
      return true;
    }
    return producesTelemetry(child);
  }
}
