import { expect, test } from '../support/cupola.fixture';

const PLAN_START = Date.UTC(2026, 6, 13, 7, 30, 0);
const PLAN_END = Date.UTC(2026, 6, 13, 13, 30, 0);
// After every activity ends, so all classify as past (no in-progress exemption).
const NOW_ALL_PAST = Date.UTC(2026, 6, 13, 13, 15, 0);
// Mid-plan: Array repointing (09:00–11:00) is in progress.
const NOW_MID = Date.UTC(2026, 6, 13, 10, 30, 0);

async function openTimeList(
  shell: { goto: (p: string) => Promise<void> },
  plan: { timeList: import('@playwright/test').Locator },
  realtime: {
    setBounds: (b: { start: number; end: number }) => Promise<void>;
    setNow: (t: number) => Promise<void>;
  },
  now: number,
): Promise<void> {
  await shell.goto('browse/operations/planning-lab/ops-timelist');
  await expect(plan.timeList).toBeVisible();
  await realtime.setBounds({ start: PLAN_START, end: PLAN_END });
  await realtime.setNow(now);
}

test.describe('C12 L1-03 — Time lists', () => {
  test(
    'OMCT-C12-L2-03.01 — a time list displays the composed plan activities',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-03.01' }] },
    async ({ shell, plan, realtime }) => {
      await openTimeList(shell, plan, realtime, NOW_ALL_PAST);
      await expect(plan.timeList).toBeVisible();
      await expect(plan.timeListRows).toHaveCount(4);
    },
  );

  test(
    'OMCT-C12-L2-03.02 — filters narrow the visible activities',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-03.02' }] },
    async ({ shell, plan, realtime }) => {
      await openTimeList(shell, plan, realtime, NOW_ALL_PAST);
      await expect(plan.timeListRows).toHaveCount(4);

      await plan.filterInput.fill('Eclipse');
      await expect(plan.timeListRows).toHaveCount(1);
      await expect(plan.timeListName(0)).toHaveText('Eclipse preparation');

      await plan.filterInput.fill('');
      await plan.classSelect.selectOption('current-future');
      // Everything is past at NOW_ALL_PAST, so no rows remain.
      await expect(plan.timeListRows).toHaveCount(0);
    },
  );

  test(
    'OMCT-C12-L2-03.03 — activities sort by the selected header',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-03.03' }] },
    async ({ shell, plan, realtime }) => {
      await openTimeList(shell, plan, realtime, NOW_ALL_PAST);
      await expect(plan.timeListRows).toHaveCount(4);

      // Default sort is start ascending: Eclipse preparation is first.
      await expect(plan.timeListName(0)).toHaveText('Eclipse preparation');

      await plan.sortHeader('name').click();
      await expect(plan.timeListName(0)).toHaveText('Array repointing');
    },
  );

  test(
    'OMCT-C12-L2-03.04 — rows show temporal class, duration, and progress',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-03.04' }] },
    async ({ shell, plan, realtime, page }) => {
      await openTimeList(shell, plan, realtime, NOW_MID);
      await expect(plan.timeListRows).toHaveCount(4);

      await expect(page.locator('[data-testid="time-list-row"][data-temporal="past"]')).toHaveCount(
        1,
      );
      await expect(
        page.locator('[data-testid="time-list-row"][data-temporal="current"]').first(),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="time-list-row"][data-temporal="future"]'),
      ).toHaveCount(1);

      const current = page
        .locator('[data-testid="time-list-row"][data-temporal="current"]')
        .first();
      await expect(current.getByTestId('time-list-progress')).toContainText('%');
      // Array repointing runs 09:00–11:00 → a two-hour duration.
      const arrayRow = page.locator('[data-testid="time-list-row"][data-id="Station ops::1"]');
      await expect(arrayRow.getByTestId('time-list-duration')).toHaveText('02:00:00');
    },
  );
});
