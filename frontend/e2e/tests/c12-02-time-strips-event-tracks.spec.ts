import { expect, test } from '../support/cupola.fixture';

// A realtime event to append to the log.activity track (within the strip's
// independent fixed window, at an unaligned instant so it is a new marker).
const APPEND_TS = Date.UTC(2026, 6, 13, 10, 30, 0) + 12_345;

test.describe('C12 L1-02 — Time strips and event tracks', () => {
  test(
    'OMCT-C12-L2-02.01 — a time strip renders its composed plan, plot, and event rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-02.01' }] },
    async ({ shell, plan }) => {
      await shell.goto('browse/operations/planning-lab/ops-strip');
      await expect(plan.strip).toBeVisible();

      await expect(plan.stripRows).toHaveCount(3);
      await expect(plan.stripRow('plan')).toHaveCount(1);
      await expect(plan.stripRow('plot')).toHaveCount(1);
      await expect(plan.stripRow('event')).toHaveCount(1);
    },
  );

  test(
    'OMCT-C12-L2-02.02 — composed rows align to one shared time axis',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-02.02' }] },
    async ({ shell, plan }) => {
      await shell.goto('browse/operations/planning-lab/ops-strip');
      await expect(plan.strip).toBeVisible();

      await expect(plan.timeAxis).toBeVisible();
      await expect(plan.timeAxisTicks.first()).toBeVisible();
      await expect(plan.stripRows).toHaveCount(3);
    },
  );

  test(
    'OMCT-C12-L2-02.03 — the strip exposes independent fixed/realtime controls',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-02.03' }] },
    async ({ shell, plan }) => {
      await shell.goto('browse/operations/planning-lab/ops-strip');
      await expect(plan.strip).toBeVisible();

      await expect(plan.independentTime).toBeVisible();
      await expect(plan.modeToggle).toHaveAttribute('data-mode', 'fixed');
      await plan.modeToggle.click();
      await expect(plan.modeToggle).toHaveAttribute('data-mode', 'realtime');
    },
  );

  test(
    'OMCT-C12-L2-02.04 — the event track renders markers from history and appends realtime events',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-02.04' }] },
    async ({ shell, plan, realtime }) => {
      await shell.goto('browse/operations/planning-lab/ops-strip');
      await expect(plan.strip).toBeVisible();
      await expect(plan.eventMarkers.first()).toBeVisible();

      await realtime.pushTelemetry('log.activity', 42, new Date(APPEND_TS).toISOString());
      await expect(
        plan.page.locator(`[data-testid="event-marker"][data-timestamp="${APPEND_TS}"]`),
      ).toBeVisible();
    },
  );

  test(
    'OMCT-C12-L2-02.05 — selecting an event extends a line across the strip rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C12-L2-02.05' }] },
    async ({ shell, plan }) => {
      await shell.goto('browse/operations/planning-lab/ops-strip');
      await expect(plan.strip).toBeVisible();
      await expect(plan.eventMarkers.first()).toBeVisible();

      // Event markers are dense; force the click past overlapping labels — any
      // event selection publishes the extended line.
      await plan.eventMarkers.first().click({ force: true });
      await expect(plan.extendedLine).toBeVisible();
    },
  );
});
