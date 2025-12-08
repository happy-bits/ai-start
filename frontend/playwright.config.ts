import { defineConfig } from '@playwright/test';

// Worker port configuration (must match global-setup.ts)
const getWorkerPorts = (workerIndex: number) => ({
  backend: 3001 + workerIndex,
  frontend: 5174 + workerIndex,
});

export default defineConfig({
  testDir: './e2e',
  // Enable parallel execution across workers
  fullyParallel: true,
  workers: 3,
  retries: 0,
  timeout: 5000, // 5 seconds per test
  reporter: 'html',
  // Global setup/teardown to manage test servers
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    // Base URL will be set per-worker in beforeEach
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
