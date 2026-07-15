import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile viewport Playwright configuration (OMCT-C16-L2-03.04). Runs the mobile
 * smoke scenarios against iPad landscape and iPhone 14 Pro WebKit projects.
 */
export default defineConfig({
  testDir: 'e2e/tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list']],
  outputDir: 'test-results/mobile',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'ipad-landscape',
      use: { ...devices['iPad (gen 7) landscape'] },
    },
    {
      name: 'iphone-14-pro',
      use: { ...devices['iPhone 14 Pro'] },
    },
  ],
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
