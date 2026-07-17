import { defineConfig } from '@playwright/test';

/**
 * Marketing "shots" Playwright configuration. Captures product screenshots
 * against the REAL application — the .NET backend on :5240 and the Angular dev
 * server on :4200 with its /api and /hubs proxy — rather than the faked backend
 * the functional e2e suites use. Runs serially in a single worker with a pinned
 * viewport and clock so the captured frames are deterministic. Masters are
 * written to marketing/assets by the spec, then optimized via
 * `npm run shots:optimize`.
 *
 * The device-scale factor of 2 renders retina-resolution PNGs; the viewport is
 * overridden per-test for the 1200x630 Open Graph image.
 */
export default defineConfig({
  testDir: 'e2e/marketing',
  outputDir: 'test-results/marketing',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env['CI'],
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'dotnet run --project ../backend/src/Cupola.Api/Cupola.Api.csproj',
      url: 'http://localhost:5240/api/branding',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 240_000,
    },
  ],
});
