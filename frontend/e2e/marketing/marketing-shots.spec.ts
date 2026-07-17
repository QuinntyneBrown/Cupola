import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Page } from '@playwright/test';

import { expect, test } from './marketing.fixture';

// Repo-root-relative output directories. __dirname is
// <repo>/frontend/e2e/marketing at runtime (Playwright loads specs in a
// CommonJS context, matching the existing perf specs' use of __dirname).
const REPO_ROOT = resolve(__dirname, '../../..');
const SHOTS_DIR = join(REPO_ROOT, 'marketing', 'assets', 'shots', 'src');
const OG_DIR = join(REPO_ROOT, 'marketing', 'assets', 'og');

/**
 * Waits for fonts to settle, lets the last frame paint, then writes a viewport
 * PNG master. Animations are frozen and the caret hidden so repeated runs are
 * byte-stable enough for review.
 */
async function captureShot(page: Page, dir: string, name: string): Promise<void> {
  mkdirSync(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(dir, `${name}.png`),
    animations: 'disabled',
    caret: 'hide',
  });
}

test.describe('marketing shots', () => {
  test('dashboard', async ({ page, shell, layout }) => {
    await shell.goto('browse/mine/station-displays/power-dashboard');
    await expect(layout.canvas).toBeVisible();
    await expect(layout.frames.first()).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'dashboard');
  });

  test('layout', async ({ page, shell, layout }) => {
    await shell.goto('browse/mine/layouts-lab/dl.station');
    await expect(layout.canvas).toBeVisible();
    await expect(layout.frames.first()).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'layout');
  });

  test('stacked-plot', async ({ page, shell, plot }) => {
    await shell.goto('browse/mine/plots-lab/eclipse-stack');
    await expect.poll(() => plot.stackedRows.count()).toBeGreaterThanOrEqual(2);
    await expect(plot.seriesLines.first()).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'stacked-plot');
  });

  test('imagery', async ({ page, shell, imagery }) => {
    await shell.goto('browse/station/comms/cam.cupola');
    await expect(imagery.view).toBeVisible();
    await expect(imagery.focusedImage).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'imagery');
  });

  // ops-strip rather than ops-gantt: the strip's independentTime config frames
  // the full 07:30-13:30 plan, while the gantt follows the conductor's narrow
  // 15-minute follow window and photographs nearly empty.
  test('timeline', async ({ page, shell, plan }) => {
    await shell.goto('browse/operations/planning-lab/ops-strip');
    await expect(plan.strip).toBeVisible();
    await expect.poll(() => plan.stripRows.count()).toBeGreaterThanOrEqual(2);
    await expect(plan.activities.first()).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'timeline');
  });

  test('notebook', async ({ page, shell, notebook }) => {
    await shell.goto('browse/mine/ops-notebook');
    await expect(notebook.view).toBeVisible();
    await expect(notebook.entries.first()).toBeVisible();
    await captureShot(page, SHOTS_DIR, 'notebook');
  });

  test('conditions', async ({ page, shell, conditionSet }) => {
    await shell.goto('browse/mine/conditions-lab/bus-monitor');
    await expect(conditionSet.view).toBeVisible();
    // No page-object collection for criteria rows; the criteria are rendered as
    // `condition-row` test-ids (see ConditionSetPage.conditionRow(id)).
    await expect(page.getByTestId('condition-row').first()).toBeVisible();
    await conditionSet.settle();
    await captureShot(page, SHOTS_DIR, 'conditions');
  });

  test.describe('og-image', () => {
    // The Open Graph card is a flat 1200x630 at 1x — the standard social size.
    test.use({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

    test('og-image', async ({ page, shell, layout }) => {
      await shell.goto('browse/mine/station-displays/power-dashboard');
      await expect(layout.canvas).toBeVisible();
      await expect(layout.frames.first()).toBeVisible();
      await captureShot(page, OG_DIR, 'og-image');
    });
  });
});
