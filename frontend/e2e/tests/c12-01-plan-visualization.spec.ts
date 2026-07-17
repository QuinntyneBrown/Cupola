import { expect, test } from '../support/cupola.fixture';

// The seeded ISS plan spans 2026-07-13 08:00–13:00 UTC. Pin the conductor to a
// window around it so activities position deterministically.
const PLAN_START = Date.UTC(2026, 6, 13, 7, 30, 0);
const PLAN_END = Date.UTC(2026, 6, 13, 13, 30, 0);

test.describe('C12 L1-01 — Plan visualization', () => {
  test(
    'OMCT-C12-L2-01.01 — a plan renders its activity groups and activities from plan data',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-01.01' }] },
    async ({ shell, plan, realtime }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });

      await expect(plan.groups).toHaveCount(2);
      await expect(plan.group('Station ops')).toBeVisible();
      await expect(plan.group('Crew')).toBeVisible();
      await expect(plan.activities).toHaveCount(4);
    },
  );

  test(
    'OMCT-C12-L2-01.02 — activities are positioned within the active time bounds',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-01.02' }] },
    async ({ shell, plan, realtime }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });
      await expect(plan.activities).toHaveCount(4);

      const chart = await plan.chart.boundingBox();
      const bar = await plan.activities.first().boundingBox();
      expect(chart).not.toBeNull();
      expect(bar).not.toBeNull();
      // The activity bar sits within the chart's horizontal extent and has width.
      expect(bar!.x).toBeGreaterThanOrEqual(chart!.x - 1);
      expect(bar!.x + bar!.width).toBeLessThanOrEqual(chart!.x + chart!.width + 1);
      expect(bar!.width).toBeGreaterThan(0);
    },
  );

  test(
    'OMCT-C12-L2-01.03 — overlapping activities stack onto separate rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-01.03' }] },
    async ({ shell, plan, realtime }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });

      // Station ops has two overlapping activities (08:00–09:30 and 09:00–11:00),
      // so the group renders two swimlane rows; Crew has one.
      await expect(plan.groupRows('Station ops')).toHaveCount(2);
      await expect(plan.groupRows('Crew')).toHaveCount(1);
    },
  );

  test(
    'OMCT-C12-L2-01.04 — selecting an activity shows its timing and metadata in the inspector',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-01.04' }] },
    async ({ shell, plan, realtime, inspector }) => {
      await shell.goto('browse/operations/iss-plan');
      await expect(plan.view).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });

      await plan.groupActivities('Station ops').first().click();
      await inspector.openTab('activity-inspector');
      await expect(plan.activityName).toHaveText('Eclipse preparation');
      await expect(plan.activityStart).toContainText('2026-07-13');
      await expect(plan.activityDuration).toHaveText('01:30:00');
    },
  );

  test(
    'OMCT-C12-L2-01.05 — a gantt chart renders its composed plan',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-01.05' }] },
    async ({ shell, plan, realtime }) => {
      await shell.goto('browse/operations/planning-lab/ops-gantt');
      await expect(plan.gantt).toBeVisible();
      await realtime.setBounds({ start: PLAN_START, end: PLAN_END });

      await expect(plan.ganttPlans).toHaveCount(1);
      await expect(plan.ganttPlans.first()).toContainText('ISS daily plan');
      await expect(plan.activities).toHaveCount(4);
    },
  );
});
