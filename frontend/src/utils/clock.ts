/**
 * Clock abstraction for date/time - allows tests to simulate a specific date.
 *
 * In production: uses real Date()
 * In e2e tests: set window.__TEST_DATE__ before page load (ISO string, e.g. '2026-02-18')
 * In unit tests: use vi.useFakeTimers()
 */

declare global {
  interface Window {
    __TEST_DATE__?: string;
  }
}

/**
 * Get the "current" date - respects test overrides.
 * Use this instead of new Date() when the date should be configurable in tests.
 */
export function getToday(): Date {
  if (typeof window !== 'undefined' && window.__TEST_DATE__) {
    return new Date(window.__TEST_DATE__);
  }
  return new Date();
}
