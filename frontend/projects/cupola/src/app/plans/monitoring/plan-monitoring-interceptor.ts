import { DomainObject, Identifier, ObjectInterceptor, isMissingObject } from '@cupola/core';

import { PLAN_MONITORING_KEY, planMonitoringDefault } from './activity-states';

/**
 * Represents the shared plan-execution-monitoring object with a default when
 * none is persisted (OMCT-C12-L2-04.03). Runs after the missing-object
 * interceptor, replacing its placeholder for the fixed identifier.
 */
export class PlanMonitoringInterceptor implements ObjectInterceptor {
  appliesTo(identifier: Identifier, object: DomainObject | undefined): boolean {
    return (
      identifier.namespace === '' &&
      identifier.key === PLAN_MONITORING_KEY &&
      (object === undefined || isMissingObject(object))
    );
  }

  invoke(): DomainObject {
    return planMonitoringDefault();
  }
}
