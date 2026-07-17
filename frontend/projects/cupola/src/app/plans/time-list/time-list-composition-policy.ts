import { CompositionPolicy, DomainObject } from '@cupola/core';

/**
 * A time list composes a single plan (OMCT-C12-L2-03.01). Only plan objects are
 * accepted; other parent types are not constrained.
 */
export class TimeListCompositionPolicy implements CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'time-list') {
      return true;
    }
    return child.type === 'plan';
  }
}
