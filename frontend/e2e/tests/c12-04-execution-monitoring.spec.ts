import { expect, test } from '../support/cupola.fixture';

import type { FakeBackend } from '../support/fake-backend';

const PLAN_START = Date.UTC(2026, 6, 13, 7, 30, 0);
const PLAN_END = Date.UTC(2026, 6, 13, 13, 30, 0);
const ACTIVITY_ID = 'Station ops::0'; // Eclipse preparation (first Station ops activity)

function tryObject(fakeBackend: FakeBackend, key: string): Record<string, unknown> | undefined {
  try {
    return fakeBackend.object(key) as unknown as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function activities(fakeBackend: FakeBackend): Record<string, string> | undefined {
  const object = tryObject(fakeBackend, 'activity-states');
  return (object?.['configuration'] as { activities?: Record<string, string> } | undefined)?.activities;
}

function plans(fakeBackend: FakeBackend): Record<string, unknown> | undefined {
  const object = tryObject(fakeBackend, 'plan-execution-monitoring');
  return (object?.['configuration'] as { plans?: Record<string, unknown> } | undefined)?.plans;
}

test.describe('C12 L1-04 — Execution monitoring state', () => {
  test(
    'OMCT-C12-L2-04.01 — the default Activity States object is created from the interceptor when unavailable',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-04.01' }] },
    async ({ shell, plan, realtime, inspector, fakeBackend }) => {
      // No fixture object exists for the activity-state root.
      expect(tryObject(fakeBackend, 'activity-states')).toBeUndefined();

      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });
      await plan.groupActivities('Station ops').first().click();
      await inspector.openTab('activity-inspector');
      await plan.executionState.selectOption('in-progress');

      await expect
        .poll(() => tryObject(fakeBackend, 'activity-states')?.['name'])
        .toBe('Activity States');
      expect(tryObject(fakeBackend, 'activity-states')?.['type']).toBe('activity-states');
    },
  );

  test(
    'OMCT-C12-L2-04.02 — changing an activity execution state persists it by activity identifier',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-04.02' }] },
    async ({ shell, plan, realtime, inspector, fakeBackend }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });
      await plan.groupActivities('Station ops').first().click();
      await inspector.openTab('activity-inspector');
      await plan.executionState.selectOption('aborted');

      await expect.poll(() => activities(fakeBackend)?.[ACTIVITY_ID]).toBe('aborted');
    },
  );

  test(
    'OMCT-C12-L2-04.03 — the default Plan Execution Monitoring object is created when unavailable',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-04.03' }] },
    async ({ shell, plan, inspector, fakeBackend }) => {
      expect(tryObject(fakeBackend, 'plan-execution-monitoring')).toBeUndefined();

      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await inspector.openTab('plan-monitoring');
      await plan.monitoringStatus.selectOption('active');

      await expect
        .poll(() => tryObject(fakeBackend, 'plan-execution-monitoring')?.['name'])
        .toBe('Plan Execution Monitoring');
    },
  );

  test(
    'OMCT-C12-L2-04.04 — plan monitoring status and duration persist by plan identifier',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-04.04' }] },
    async ({ shell, plan, inspector, fakeBackend }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await inspector.openTab('plan-monitoring');

      await plan.monitoringStatus.selectOption('active');
      await plan.monitoringDuration.fill('03:30:00');
      await plan.monitoringDuration.blur();

      await expect.poll(() => plans(fakeBackend)?.['iss-plan']).toEqual({
        status: 'active',
        duration: 12_600_000,
      });
    },
  );
});
