import { describe, expect, it } from 'vitest';
import {
  formatVietnamPhone,
  sanitizePhoneField,
  trimFieldValue,
  validateVietnamPhoneMessage,
  VN_PHONE_INVALID,
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

  it('keeps the 11th digit instead of dropping it', () => {
    expect(sanitizePhoneField('08234567899')).toBe('0823 456 7899');
  });
});

describe('validateVietnamPhoneMessage', () => {
  it('accepts 03/05/07/08/09 prefixes, not only 09', () => {
    expect(validateVietnamPhoneMessage('0823456789')).toBeNull();
    expect(validateVietnamPhoneMessage('0323456789')).toBeNull();
    expect(validateVietnamPhoneMessage('0523456789')).toBeNull();
    expect(validateVietnamPhoneMessage('0723456789')).toBeNull();
    expect(validateVietnamPhoneMessage('0912345678')).toBeNull();
  });

  it('accepts 11-digit numbers starting with 0', () => {
    expect(validateVietnamPhoneMessage('08234567899')).toBeNull();
    expect(validateVietnamPhoneMessage('02412345678')).toBeNull();
  });

  it('accepts +84 mobile numbers', () => {
    expect(validateVietnamPhoneMessage('+84823456789')).toBeNull();
  });

  it('rejects numbers that do not start with 0, without implying only 09 is valid', () => {
    expect(validateVietnamPhoneMessage('9123456789')).toBe(VN_PHONE_INVALID);
    expect(VN_PHONE_INVALID).not.toMatch(/0912/);
    expect(VN_PHONE_INVALID).toMatch(/03, 05, 07, 08, 09/);
  });
});
