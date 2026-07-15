import { defineConfig, devices } from '@playwright/test';

/**
 * Development-mode contract performance configuration (OMCT-C16-L2-05.02). Runs
 * the contract performance specifications (which assert against performance
 * marks) against the dev server.
 */
export default defineConfig({
  testDir: 'e2e/tests/performance/contract',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/performance-dev',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-contract',
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
