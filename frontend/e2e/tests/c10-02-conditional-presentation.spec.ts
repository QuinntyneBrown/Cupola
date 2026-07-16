import { expect, test } from '../support/cupola.fixture';

const STYLE_WIDGET = 'browse/mine/conditions-lab/bus-style';
const STATUS_WIDGET = 'browse/mine/conditions-lab/bus-status';
const SUMMARY = 'browse/mine/conditions-lab/power-summary';

test.describe('C10 L1-02 — Conditional presentation and summary widgets', () => {
  test(
    'OMCT-C10-L2-02.01 — conditional styles replace on the active output',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-02.01' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(STYLE_WIDGET);
      await expect(conditionSet.widget).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 20);
      await expect(conditionSet.widget).toHaveCSS('background-color', 'rgb(240, 82, 74)');

      await realtime.pushTelemetry('pwr.bus_v', 30);
      await expect(conditionSet.widget).toHaveCSS('background-color', 'rgb(63, 185, 80)');
    },
  );

  test(
    'OMCT-C10-L2-02.02 — a condition widget renders the active label, link, and styling',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-02.02' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(STATUS_WIDGET);
      await expect(conditionSet.widget).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 20);
      await expect(conditionSet.widgetLabel).toHaveText('UNDERVOLTAGE');
      await expect(conditionSet.widget).toHaveClass(/condw--critical/);
      await expect(conditionSet.widget).toHaveAttribute('href', 'https://status.example.com/bus');

      await realtime.pushTelemetry('pwr.bus_v', 30);
      await expect(conditionSet.widgetLabel).toHaveText('NOMINAL');
      await expect(conditionSet.widget).toHaveClass(/condw--ok/);
    },
  );

  test(
    'OMCT-C10-L2-02.03 — a summary widget selects a rule from telemetry',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-02.03' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(SUMMARY);
      await expect(conditionSet.summaryPreview).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 10);
      await expect(conditionSet.summaryPreview).toHaveText('NOMINAL');

      await realtime.pushTelemetry('pwr.bus_v', 95);
      await expect(conditionSet.summaryPreview).toHaveText('CRITICAL');
    },
  );

  test(
    'OMCT-C10-L2-02.04 — a summary rule evaluates its any-object scope',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-02.04' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(SUMMARY);
      await expect(conditionSet.summaryPreview).toBeVisible();
      await conditionSet.settle();

      // The critical rule uses "any composed object"; a single high source
      // satisfies it.
      await realtime.pushTelemetry('pwr.array_out', 99);
      await expect(conditionSet.summaryPreview).toHaveText('CRITICAL');
    },
  );

  test(
    'OMCT-C10-L2-02.05 — test data previews rules without persisting telemetry',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-02.05' }] },
    async ({ shell, conditionSet, page }) => {
      await shell.goto(SUMMARY);
      await expect(conditionSet.summaryPreview).toBeVisible();
      await expect(conditionSet.summaryPreview).toHaveText('NOMINAL');

      await conditionSet.summaryEdit.click();
      await conditionSet.summaryTestToggle.click();
      await conditionSet.summaryTestInput('pwr.bus_v').fill('99');

      await expect(conditionSet.summaryPreview).toHaveText('CRITICAL');
    },
  );
});
