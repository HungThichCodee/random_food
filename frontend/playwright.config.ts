import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '../docs/audits/playwright-results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    channel: 'msedge',
  },
  reporter: 'list',
  workers: 1,
});
