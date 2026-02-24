import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDaysFromToday,
  addMonthsFromToday,
  addWorkDaysFromToday,
  formatDate,
  getCurrentTimeHHMM,
  getTodayISO,
} from '../dates';

describe('dates utilities', () => {
  describe('getTodayISO', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const result = getTodayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns today's date", () => {
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      expect(getTodayISO()).toBe(expected);
    });
  });

  describe('getCurrentTimeHHMM', () => {
    it('returns time in HH:MM format', () => {
      const result = getCurrentTimeHHMM();
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns valid time values', () => {
      const result = getCurrentTimeHHMM();
      const [hours, minutes] = result.split(':').map(Number);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string with default options', () => {
      const dateString = '2024-01-15';
      const result = formatDate(dateString);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('formats Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('handles different date formats', () => {
      const dateString = '2024-12-25';
      const result = formatDate(dateString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(result).toBeTruthy();
    });
  });

  describe('addWorkDaysFromToday', () => {
    beforeEach(() => {
      // Mock Date to a known Monday (2024-01-15 is a Monday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds 0 work days returns today', () => {
      const result = addWorkDaysFromToday(0);
      expect(result).toBe('2024-01-15');
    });

    it('adds 1 work day (skips to Tuesday)', () => {
      const result = addWorkDaysFromToday(1);
      expect(result).toBe('2024-01-16');
    });

    it('adds 5 work days (skips weekend)', () => {
      const result = addWorkDaysFromToday(5);
      // Monday + 5 work days = next Monday
      expect(result).toBe('2024-01-22');
    });

    it('skips weekends when adding work days', () => {
      // Start on Friday (2024-01-19 is a Friday)
      vi.setSystemTime(new Date('2024-01-19T10:00:00Z'));
      const result = addWorkDaysFromToday(1);
      // Should skip Saturday and Sunday, return Monday
      expect(result).toBe('2024-01-22');
    });

    it('handles multiple weekends', () => {
      // Start on Monday
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const result = addWorkDaysFromToday(10);
      // 10 work days = 2 weeks = Monday + 2 weeks = Monday
      expect(result).toBe('2024-01-29');
    });
  });

  describe('addDaysFromToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds 0 days returns today', () => {
      const result = addDaysFromToday(0);
      expect(result).toBe('2024-01-15');
    });

    it('adds 1 day', () => {
      const result = addDaysFromToday(1);
      expect(result).toBe('2024-01-16');
    });

    it('adds 7 days', () => {
      const result = addDaysFromToday(7);
      expect(result).toBe('2024-01-22');
    });

    it('adds negative days (subtracts)', () => {
      const result = addDaysFromToday(-1);
      expect(result).toBe('2024-01-14');
    });

    it('handles month boundaries', () => {
      vi.setSystemTime(new Date('2024-01-31T10:00:00Z'));
      const result = addDaysFromToday(1);
      expect(result).toBe('2024-02-01');
    });

    it('handles year boundaries', () => {
      vi.setSystemTime(new Date('2024-12-31T10:00:00Z'));
      const result = addDaysFromToday(1);
      expect(result).toBe('2025-01-01');
    });
  });

  describe('addMonthsFromToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds 0 months returns today', () => {
      const result = addMonthsFromToday(0);
      expect(result).toBe('2024-01-15');
    });

    it('adds 1 month', () => {
      const result = addMonthsFromToday(1);
      expect(result).toBe('2024-02-15');
    });

    it('adds 12 months (1 year)', () => {
      const result = addMonthsFromToday(12);
      expect(result).toBe('2025-01-15');
    });

    it('handles month boundaries correctly', () => {
      vi.setSystemTime(new Date('2024-01-31T10:00:00Z'));
      const result = addMonthsFromToday(1);
      // JavaScript Date.setMonth() wraps when day doesn't exist in target month
      // January 31 + 1 month = March 2 (since Feb only has 29 days in 2024)
      expect(result).toBe('2024-03-02');
    });

    it('handles year boundaries', () => {
      vi.setSystemTime(new Date('2024-12-15T10:00:00Z'));
      const result = addMonthsFromToday(1);
      expect(result).toBe('2025-01-15');
    });

    it('handles negative months (subtracts)', () => {
      const result = addMonthsFromToday(-1);
      expect(result).toBe('2023-12-15');
    });
  });
});
