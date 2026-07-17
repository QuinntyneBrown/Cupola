import { createMissingObject } from '@cupola/core';

import { ActivityStatesInterceptor } from './activity-states-interceptor';
import { PlanMonitoringInterceptor } from './plan-monitoring-interceptor';
import {
  ACTIVITY_STATES_KEY,
  ACTIVITY_STATES_NAME,
  PLAN_MONITORING_KEY,
  PLAN_MONITORING_NAME,
} from './activity-states';

describe('OMCT-C12-L2-04.01 Activity-state root', () => {
  const interceptor = new ActivityStatesInterceptor();
  const identifier = { namespace: '', key: ACTIVITY_STATES_KEY };

  it('applies when the activity-state object is unavailable', () => {
    expect(interceptor.appliesTo(identifier, undefined)).toBe(true);
    expect(interceptor.appliesTo(identifier, createMissingObject(identifier))).toBe(true);
  });

  it('does not apply to an existing object or a different identifier', () => {
    const existing = { ...createMissingObject(identifier), isMissing: false } as never;
    expect(interceptor.appliesTo(identifier, existing)).toBe(false);
    expect(interceptor.appliesTo({ namespace: '', key: 'other' }, undefined)).toBe(false);
  });

  it('returns the default activity-state object without a persisted stamp', () => {
    const object = interceptor.invoke();
    expect(object.keyString).toBe(ACTIVITY_STATES_KEY);
    expect(object.name).toBe(ACTIVITY_STATES_NAME);
    expect(object.persisted).toBeUndefined();
    expect(object.configuration).toEqual({ activities: {} });
  });
});

describe('OMCT-C12-L2-04.03 Plan execution-monitoring root', () => {
  const interceptor = new PlanMonitoringInterceptor();
  const identifier = { namespace: '', key: PLAN_MONITORING_KEY };

  it('applies when the plan-monitoring object is unavailable', () => {
    expect(interceptor.appliesTo(identifier, undefined)).toBe(true);
    expect(interceptor.appliesTo(identifier, createMissingObject(identifier))).toBe(true);
  });

  it('returns the default plan-monitoring object without a persisted stamp', () => {
    const object = interceptor.invoke();
    expect(object.keyString).toBe(PLAN_MONITORING_KEY);
    expect(object.name).toBe(PLAN_MONITORING_NAME);
    expect(object.persisted).toBeUndefined();
    expect(object.configuration).toEqual({ plans: {} });
  });
});
