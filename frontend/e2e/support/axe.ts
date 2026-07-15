import { AxeBuilder } from '@axe-core/playwright';
import { expect, Page, TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Scans the current page for WCAG 2 AA accessibility violations and asserts
 * there are none. When violations are found it writes a JSON accessibility
 * report and a screenshot under the Playwright test-results output directory
 * before failing. OMCT-C16-L2-03.01, OMCT-C16-L2-03.03.
 */
export async function expectNoA11yViolations(
  page: Page,
  testInfo: TestInfo,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  const { violations } = results;

  if (violations.length > 0) {
    const slug = label.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    await mkdir(testInfo.outputDir, { recursive: true });
    await writeFile(
      join(testInfo.outputDir, `a11y-${slug}.json`),
      JSON.stringify(violations, null, 2),
      'utf8',
    );
    await page.screenshot({ path: join(testInfo.outputDir, `a11y-${slug}.png`), fullPage: true });
  }

  expect(violations, summarize(label, violations)).toEqual([]);
}

function summarize(label: string, violations: { id: string; help: string }[]): string {
  if (violations.length === 0) {
    return `${label}: no accessibility violations`;
  }
  const lines = violations.map((v) => `  - ${v.id}: ${v.help}`);
  return `${label}: ${violations.length} accessibility violation(s)\n${lines.join('\n')}`;
}
