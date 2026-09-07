import { describe, expect, it } from 'vitest';
import {
  parseSystemCodeNumber,
  suggestNextSystemCode,
  validateSystemAccountCode,
} from './suggestedSystemCode';

describe('parseSystemCodeNumber', () => {
  it('reads sequential SYS codes', () => {
    expect(parseSystemCodeNumber('SYS-0001')).toBe(1);
    expect(parseSystemCodeNumber('sys-12')).toBe(12);
  });

  it('ignores timestamp and named system codes', () => {
    expect(parseSystemCodeNumber('SYS-20260907030104')).toBeNull();
    expect(parseSystemCodeNumber('SYS-ADMIN')).toBeNull();
    expect(parseSystemCodeNumber('NV-0001')).toBeNull();
  });
});

describe('suggestNextSystemCode', () => {
  it('starts at SYS-0001 when empty', () => {
    expect(suggestNextSystemCode([])).toBe('SYS-0001');
  });

  it('skips timestamp leftovers and increments sequential codes', () => {
    expect(suggestNextSystemCode(['SYS-20260907030104', 'SYS-ADMIN', 'SYS-0002'])).toBe('SYS-0003');
  });
});

describe('validateSystemAccountCode', () => {
  it('rejects HR employee codes', () => {
    expect(validateSystemAccountCode('NV-0101')).toMatch(/SYS-/);
  });

  it('accepts SYS-ADMIN and SYS-0001', () => {
    expect(validateSystemAccountCode('SYS-ADMIN')).toBeNull();
    expect(validateSystemAccountCode('SYS-0001')).toBeNull();
  });
});
