import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Seriellt för långt test
  workers: 1, // Run tests sequentially (one at a time)
  retries: 0,
  timeout: 5000, // 5 seconds per test
  reporter: 'html',
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'sv-SE'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ]
});


