import { test as base } from '@playwright/test';

// Worker port configuration (must match global-setup.ts)
const getWorkerPorts = (workerIndex: number) => ({
  backend: 3001 + workerIndex,
  frontend: 5174 + workerIndex,
});

// Extended test fixture that automatically sets the correct baseURL per worker
export const test = base.extend({
  // Override the page fixture to use worker-specific URL
  page: async ({ page }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    const ports = getWorkerPorts(workerIndex);
    const baseURL = `http://localhost:${ports.frontend}`;

    // Navigate to the worker-specific frontend on first use
    await page.goto(baseURL);
    
    // Set up automatic baseURL resolution
    const originalGoto = page.goto.bind(page);
    page.goto = async (url: string, options?: Parameters<typeof page.goto>[1]) => {
      // If URL is relative, prepend worker-specific baseURL
      if (url.startsWith('/')) {
        return originalGoto(`${baseURL}${url}`, options);
      }
      return originalGoto(url, options);
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';
