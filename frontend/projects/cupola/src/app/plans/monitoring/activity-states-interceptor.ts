import { DomainObject, Identifier, ObjectInterceptor, isMissingObject } from '@cupola/core';

import { ACTIVITY_STATES_KEY, activityStatesDefault } from './activity-states';

/**
 * Represents the shared activity-state object with a default when none is
 * persisted (OMCT-C12-L2-04.01). Runs after the missing-object interceptor, so
 * it also replaces the missing-object placeholder for the fixed identifier.
 */
export class ActivityStatesInterceptor implements ObjectInterceptor {
  appliesTo(identifier: Identifier, object: DomainObject | undefined): boolean {
    return (
      identifier.namespace === '' &&
      identifier.key === ACTIVITY_STATES_KEY &&
      (object === undefined || isMissingObject(object))
    );
  }

  invoke(): DomainObject {
    return activityStatesDefault();
  }
}
