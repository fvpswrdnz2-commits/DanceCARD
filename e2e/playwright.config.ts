import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '../test-results/playwright-artifacts',
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:10086',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { height: 844, width: 390 },
  },
  webServer: {
    command: 'pnpm --filter user-app dev:h5',
    cwd: '..',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:10086',
  },
});
