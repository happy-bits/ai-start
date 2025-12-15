import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../errors';

describe('errors utilities', () => {
  describe('getErrorMessage', () => {
    it('extracts message from Error instance', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('handles Error with empty message', () => {
      const error = new Error('');
      expect(getErrorMessage(error)).toBe('');
    });

    it('returns default message for non-Error types', () => {
      expect(getErrorMessage(null)).toBe('An error occurred');
      expect(getErrorMessage(undefined)).toBe('An error occurred');
      expect(getErrorMessage('string error')).toBe('An error occurred');
      expect(getErrorMessage(123)).toBe('An error occurred');
      expect(getErrorMessage({})).toBe('An error occurred');
      expect(getErrorMessage([])).toBe('An error occurred');
    });

    it('handles custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('handles TypeError', () => {
      const error = new TypeError('Type error occurred');
      expect(getErrorMessage(error)).toBe('Type error occurred');
    });

    it('handles ReferenceError', () => {
      const error = new ReferenceError('Reference error occurred');
      expect(getErrorMessage(error)).toBe('Reference error occurred');
    });
  });
});
