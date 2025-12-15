import { describe, it, expect } from 'vitest';
import { getFormInputBorder, cn } from '../styles';
import { formInputBorderNormal, formInputBorderError } from '../styles';

describe('styles utilities', () => {
  describe('getFormInputBorder', () => {
    it('returns error border class when hasError is true', () => {
      expect(getFormInputBorder(true)).toBe(formInputBorderError);
    });

    it('returns normal border class when hasError is false', () => {
      expect(getFormInputBorder(false)).toBe(formInputBorderNormal);
    });

    it('handles different error states', () => {
      expect(getFormInputBorder(true)).toBe('border-red-500');
      expect(getFormInputBorder(false)).toBe('border-dark-600');
    });
  });

  describe('cn', () => {
    it('combines multiple class strings', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('filters out undefined values', () => {
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    });

    it('filters out null values', () => {
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
    });

    it('filters out false values', () => {
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
    });

    it('filters out empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('handles empty array', () => {
      expect(cn()).toBe('');
    });

    it('handles all falsy values', () => {
      expect(cn(undefined, null, false, '')).toBe('');
    });

    it('handles mixed truthy and falsy values', () => {
      expect(cn('class1', undefined, 'class2', null, false, 'class3', '')).toBe('class1 class2 class3');
    });

    it('preserves whitespace within class strings', () => {
      expect(cn('class1 class2', 'class3')).toBe('class1 class2 class3');
    });

    it('handles single class', () => {
      expect(cn('class1')).toBe('class1');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });
  });
});
