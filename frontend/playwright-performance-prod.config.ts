import { defineConfig, devices } from '@playwright/test';

/**
 * Production-mode performance configuration (OMCT-C16-L2-05.01, OMCT-C16-L2-05.03).
 * Runs the non-contract performance specs and, in a dedicated memory project,
 * the navigation memory-leak specs. Contract specs run under the dev config.
 */
export default defineConfig({
  testDir: 'e2e/tests/performance',
  testIgnore: ['**/contract/**'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/performance',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-performance',
      testIgnore: ['**/memory/**', '**/contract/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-memory',
      testMatch: ['**/memory/**'],
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--js-flags=--expose-gc'] },
      },
    },
  ],
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
