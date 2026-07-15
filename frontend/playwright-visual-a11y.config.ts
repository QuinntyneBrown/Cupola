import { defineConfig, devices } from '@playwright/test';

/**
 * Visual-accessibility Playwright configuration (OMCT-C16-L2-03.02). Runs the
 * scenarios under e2e/tests/visual-a11y against the faked-backend dev server.
 */
export default defineConfig({
  testDir: 'e2e/tests/visual-a11y',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list']],
  outputDir: 'test-results/visual-a11y',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
