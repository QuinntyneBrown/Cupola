import { test as base } from '@playwright/test';

import { AppShellPage } from '../pages/app-shell.page';
import { ConditionSetPage } from '../pages/condition-set.page';
import { GrandSearchPage } from '../pages/grand-search.page';
import { ImageryPage } from '../pages/imagery.page';
import { LayoutPage } from '../pages/layout.page';
import { NotebookPage } from '../pages/notebook.page';
import { PlanPage } from '../pages/plan.page';
import { PlotPage } from '../pages/plot.page';
import { TelemetryTablePage } from '../pages/telemetry-table.page';

interface MarketingFixtures {
  fixedClock: void;
  shell: AppShellPage;
  layout: LayoutPage;
  plot: PlotPage;
  imagery: ImageryPage;
  plan: PlanPage;
  notebook: NotebookPage;
  conditionSet: ConditionSetPage;
  telemetryTable: TelemetryTablePage;
  grandSearch: GrandSearchPage;
}

// The seeded plan spans 2026-07-13 08:00–13:00 UTC and imagery/telemetry are
// generated relative to "now"; pinning the browser clock inside that window
// gives the conductor stable follow-mode bounds so every shot is reproducible.
const PINNED_TIME = new Date('2026-07-13T10:30:00Z');

/**
 * Base test for the marketing shot pipeline. Unlike cupola.fixture.ts there is
 * no fake-backend or realtime fixture: the specs exercise the real REST API and
 * SignalR hub through the dev-server proxy. The page-object helpers are reused
 * as-is. The `fixedClock` auto fixture pins the clock before each test's own
 * navigation so bounds and streamed telemetry resolve to the demo day.
 *
 * setSystemTime (not setFixedTime) on purpose: Date starts at the pinned
 * instant but keeps ticking. RxJS debounceTime compares scheduler.now()
 * deltas, so under a frozen Date.now it reschedules forever and debounced
 * flows (e.g. grand search) never emit.
 */
export const test = base.extend<MarketingFixtures>({
  fixedClock: [
    async ({ page }, use) => {
      await page.clock.setSystemTime(PINNED_TIME);
      await use();
    },
    { auto: true },
  ],
  shell: async ({ page }, use) => {
    await use(new AppShellPage(page));
  },
  layout: async ({ page }, use) => {
    await use(new LayoutPage(page));
  },
  plot: async ({ page }, use) => {
    await use(new PlotPage(page));
  },
  imagery: async ({ page }, use) => {
    await use(new ImageryPage(page));
  },
  plan: async ({ page }, use) => {
    await use(new PlanPage(page));
  },
  notebook: async ({ page }, use) => {
    await use(new NotebookPage(page));
  },
  conditionSet: async ({ page }, use) => {
    await use(new ConditionSetPage(page));
  },
  telemetryTable: async ({ page }, use) => {
    await use(new TelemetryTablePage(page));
  },
  grandSearch: async ({ page }, use) => {
    await use(new GrandSearchPage(page));
  },
});

export const expect = test.expect;
