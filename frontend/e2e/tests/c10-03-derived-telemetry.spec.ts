import { expect, test } from '../support/cupola.fixture';

const DERIVED = 'browse/mine/conditions-lab/derived-power';
const MEAN = 'browse/mine/conditions-lab/bus-mean';
const CORRELATION = 'browse/mine/conditions-lab/iv-correlation';

const T1 = '2026-07-16T00:00:01.000Z';
const T2 = '2026-07-16T00:00:02.000Z';

test.describe('C10 L1-03 — Derived telemetry', () => {
  test(
    'OMCT-C10-L2-03.01 — a mathematical expression emits at the shared timestamp',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-03.01' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(DERIVED);
      await expect(conditionSet.derivedValue).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.array_out', 2, T1);
      await realtime.pushTelemetry('pwr.bus_v', 3, T1);
      await realtime.pushTelemetry('pwr.array_out', 4, T2);
      await realtime.pushTelemetry('pwr.bus_v', 5, T2);

      // 4 * 5 at the aligned timestamp T2 (the sample window of 2 is now full).
      await expect(conditionSet.derivedValue).toHaveText('20.00');
    },
  );

  test(
    'OMCT-C10-L2-03.02 — accumulated output is omitted until the sample window is full',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-03.02' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(DERIVED);
      await expect(conditionSet.derivedValue).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.array_out', 2, T1);
      await realtime.pushTelemetry('pwr.bus_v', 3, T1);
      await conditionSet.settle();
      // Only one aligned sample so far; the window of 2 is not full — no output.
      await expect(conditionSet.derivedValue).toHaveText('—');

      await realtime.pushTelemetry('pwr.array_out', 4, T2);
      await realtime.pushTelemetry('pwr.bus_v', 5, T2);
      await expect(conditionSet.derivedValue).toHaveText('20.00');
    },
  );

  test(
    'OMCT-C10-L2-03.03 — mean telemetry emits over the latest sample window',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-03.03' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(MEAN);
      await expect(conditionSet.derivedValue).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 3, T1);
      await realtime.pushTelemetry('pwr.bus_v', 6, T2);
      await expect(conditionSet.derivedValue).toHaveText('—'); // fewer than 3 samples

      await realtime.pushTelemetry('pwr.bus_v', 9, '2026-07-16T00:00:03.000Z');
      await expect(conditionSet.derivedValue).toHaveText('6.00'); // mean(3, 6, 9)
    },
  );

  test(
    'OMCT-C10-L2-03.04 — correlation emits paired values on equal timestamps',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-03.04' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(CORRELATION);
      await expect(conditionSet.derivedValue).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.array_out', 5, T1);
      await expect(conditionSet.derivedValue).toHaveText('—'); // only one source yet

      await realtime.pushTelemetry('pwr.bus_v', 30, T1);
      // Paired at the same timestamp; the emitted value is the vertical source.
      await expect(conditionSet.derivedValue).toHaveText('30.00');
    },
  );
});
