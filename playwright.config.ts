import { defineConfig, devices } from '@playwright/test';

const remoteUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: remoteUrl || 'http://localhost:3133',
    trace: 'on-first-retry',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: remoteUrl
    ? undefined
    : {
        command: 'npm run start -- -p 3133',
        url: 'http://localhost:3133',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      },
});
