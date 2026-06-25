import { describe, expect, it } from 'vitest';
import {
  formatVietnamPhone,
  sanitizePhoneField,
  trimFieldValue,
} from './sanitizeInput';

describe('trimFieldValue', () => {
  it('trims leading and trailing spaces', () => {
    expect(trimFieldValue('     Nguyễn Lệ Chi          ')).toBe('Nguyễn Lệ Chi');
  });
});

describe('sanitizePhoneField', () => {
  it('formats plain digits as 4-3-3', () => {
    expect(sanitizePhoneField('0123456789')).toBe('0123 456 789');
  });

  it('trims and normalizes spaced input', () => {
    expect(sanitizePhoneField('    012 345 6789   ')).toBe('0123 456 789');
  });

  it('formats partial digits progressively', () => {
    expect(formatVietnamPhone('01234')).toBe('0123 4');
  });
});
