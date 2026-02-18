/**
 * Clock abstraction for date/time - allows tests to simulate a specific date.
 *
 * In production: uses real Date()
 * In e2e tests: set window.__TEST_DATE__ before page load (ISO string, e.g. '2026-02-18')
 * In unit tests: use setTestDate() or vi.useFakeTimers() (both work)
 */

declare global {
  interface Window {
    __TEST_DATE__?: string;
  }
}

let testDateOverride: string | null = null;

/**
 * Get the "current" date - respects test overrides.
 * Use this instead of new Date() when the date should be configurable in tests.
 */
export function getToday(): Date {
  if (testDateOverride) {
    return new Date(testDateOverride);
  }
  if (typeof window !== 'undefined' && window.__TEST_DATE__) {
    return new Date(window.__TEST_DATE__);
  }
  return new Date();
}

/**
 * Set a fixed date for testing. Call with null to clear.
 * Use in unit tests when vi.useFakeTimers() is not suitable.
 */
export function setTestDate(date: string | Date | null): void {
  testDateOverride = date
    ? typeof date === 'string'
      ? date
      : date.toISOString().split('T')[0]
    : null;
}

/**
 * Clear any test date override.
 */
export function clearTestDate(): void {
  testDateOverride = null;
}
