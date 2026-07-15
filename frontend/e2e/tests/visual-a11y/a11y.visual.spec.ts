import { expectNoA11yViolations } from '../../support/axe';
import { expect, test } from '../../support/cupola.fixture';

/**
 * Visual-accessibility scenarios (OMCT-C16-L1-03). Each covered page is scanned
 * for WCAG 2 AA violations. Coverage spans the shell pages that exist today;
 * notebook, planning, telemetry-view, gauge, and imagery scenarios are deferred
 * until those capabilities (C07, C08, C11, C12, C13) are implemented.
 */
test.describe('C16 L1-03 — Visual accessibility', () => {
  test(
    'OMCT-C16-L2-03.01 — the browse shell has no WCAG 2 AA violations',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.01' }] },
    async ({ shell, page }, testInfo) => {
      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();
      await expectNoA11yViolations(page, testInfo, 'browse-shell');
    },
  );

  test(
    'OMCT-C16-L2-03.02 — the licenses overlay has no WCAG 2 AA violations',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.02' }] },
    async ({ shell, licenses, page }, testInfo) => {
      await shell.goto('licenses');
      await expect(licenses.overlay).toBeVisible();
      await expectNoA11yViolations(page, testInfo, 'licenses');
    },
  );

  test(
    'OMCT-C16-L2-03.02 — search results have no WCAG 2 AA violations',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.02' }] },
    async ({ shell, grandSearch, page }, testInfo) => {
      await shell.goto('browse/mine');
      await grandSearch.search('solar');
      await expect(grandSearch.objectResults.first()).toBeVisible();
      await expectNoA11yViolations(page, testInfo, 'search-results');
    },
  );
});
