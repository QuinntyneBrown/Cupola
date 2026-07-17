import { CompositionPolicy, DomainObject } from '@cupola/core';

/**
 * Gantt charts compose only plan objects (OMCT-C12-L2-01.05). Any other proposed
 * child is rejected; the policy does not constrain other parent types.
 */
export class GanttCompositionPolicy implements CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type !== 'gantt-chart') {
      return true;
    }
    return child.type === 'plan';
  }
}
