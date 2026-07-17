import { expect, test } from '../support/cupola.fixture';

const STUB_PAGE = { contentType: 'text/html', body: '<html><body>stub destination</body></html>' };

test.describe('C09 L1-04 — Linked and embedded web content', () => {
  test(
    'OMCT-C09-L2-04.01 — a hyperlink renders its label with the configured link or button presentation',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-04.01' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/link.rules');
      await expect(layout.hyperlink).toContainText('Flight rules');
      await expect(layout.hyperlink).toHaveClass(/cp-link/);
      await expect(layout.hyperlink).toHaveAttribute('data-format', 'link');

      await shell.goto('browse/mine/layouts-lab/link.console');
      await expect(layout.hyperlink).toContainText('Ops console');
      await expect(layout.hyperlink).toHaveClass(/cp-btn--outlined/);
      await expect(layout.hyperlink.locator('use')).toHaveAttribute('href', '#i-external');
    },
  );

  test(
    'OMCT-C09-L2-04.02 — activation navigates using the saved current-tab or new-tab target',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-04.02' }] },
    async ({ shell, layout, page, context }) => {
      await context.route('https://ops.example.gov/**', (route) => route.fulfill(STUB_PAGE));

      // Current tab: plain navigation to the destination.
      await shell.goto('browse/mine/layouts-lab/link.rules');
      await layout.hyperlink.click();
      await expect(page).toHaveURL('https://ops.example.gov/rules');

      // New tab: opener-isolated popup.
      await shell.goto('browse/mine/layouts-lab/link.console');
      const popupPromise = context.waitForEvent('page');
      await layout.hyperlink.click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      expect(popup.url()).toBe('https://ops.example.gov/console');
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    },
  );

  test(
    'OMCT-C09-L2-04.03 — a web-page object embeds its configured URL in a sandboxed frame',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-04.03' }] },
    async ({ shell, layout, page }) => {
      await page.route('https://status.example.gov/**', (route) => route.fulfill(STUB_PAGE));

      await shell.goto('browse/mine/layouts-lab/web.tdrs');
      await expect(layout.webEmbed).toBeVisible();
      await expect(layout.webEmbed).toHaveAttribute('src', 'https://status.example.gov/tdrs');
      await expect(layout.webEmbed).toHaveAttribute('sandbox', 'allow-scripts');

      // A rejected URL renders the failure state and never creates a frame.
      await shell.goto('browse/mine/layouts-lab/web.blocked');
      await expect(layout.webEmbedError).toBeVisible();
      await expect(layout.webEmbed).toHaveCount(0);
    },
  );
});
