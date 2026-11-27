import { describe, expect, it } from 'vitest';
import { formatDateCell, formatDateVi } from './dates';
import {
  formatCurrency,
  formatCurrencyDraft,
  formatCurrencyFull,
  formatCurrencyInput,
  formatCurrencyVnd,
  parseCurrencyInput,
} from './currency';

describe('lib/format', () => {
  it('formats ISO dates as dd/MM/yyyy', () => {
    expect(formatDateVi('2026-08-27')).toBe('27/08/2026');
    expect(formatDateCell(undefined)).toBe('—');
  });

  describe('formatCurrency / formatCurrencyFull / formatCurrencyVnd / formatCurrencyInput', () => {
    it('formats integers, decimals, zero, negative zero, and non-finite inputs in vi-VN locale', () => {
      expect(formatCurrency(0)).toBe('0');
      expect(formatCurrency(-0)).toBe('0');
      expect(formatCurrency(null)).toBe('0');
      expect(formatCurrency(undefined)).toBe('0');
      expect(formatCurrency(Number.NaN)).toBe('0');
      expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('0');

      expect(formatCurrency(1_000_000)).toBe('1.000.000');
      expect(formatCurrency(1_000_000.5)).toBe('1.000.000,5');
      expect(formatCurrency(26_818.181818)).toBe('26.818,18');
      expect(formatCurrency(26_818.189, 3)).toBe('26.818,189');
      expect(formatCurrency(1_000.5, 0)).toBe('1.001');
    });

    it('appends standard VNĐ suffixes via formatCurrencyFull and formatCurrencyVnd', () => {
      expect(formatCurrencyFull(1_000_000)).toBe('1.000.000\u00a0VNĐ');
      expect(formatCurrencyFull(26_818.18)).toBe('26.818,18\u00a0VNĐ');
      expect(formatCurrencyFull(null)).toBe('0\u00a0VNĐ');

      expect(formatCurrencyVnd(1_000_000)).toBe('1.000.000 VNĐ');
      expect(formatCurrencyVnd(1_000.5)).toBe('1.000,5 VNĐ');
      expect(formatCurrencyVnd(undefined)).toBe('0 VNĐ');
    });

    it('formats positive numbers for edit inputs and returns empty string for zero/negative/null', () => {
      expect(formatCurrencyInput(null)).toBe('');
      expect(formatCurrencyInput(undefined)).toBe('');
      expect(formatCurrencyInput(0)).toBe('');
      expect(formatCurrencyInput(-500)).toBe('');
      expect(formatCurrencyInput(Number.NaN)).toBe('');
      expect(formatCurrencyInput(1_000_000)).toBe('1.000.000');
      expect(formatCurrencyInput(20_000.75)).toBe('20.000,75');
      expect(formatCurrencyInput(26_818.1818)).toBe('26.818,18');
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses Vietnamese thousands and decimals, canonical decimals, and English Excel pastes', () => {
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
      expect(parseCurrencyInput('abc VNĐ')).toBe(0);

      // Vietnamese thousands & decimals
      expect(parseCurrencyInput('1.000.000')).toBe(1_000_000);
      expect(parseCurrencyInput('1.000.000,50')).toBe(1_000_000.5);
      expect(parseCurrencyInput('1.000')).toBe(1_000);
      expect(parseCurrencyInput('50.000')).toBe(50_000);
      expect(parseCurrencyInput('999.000')).toBe(999_000);
      expect(parseCurrencyInput('1000,5')).toBe(1_000.5);
      expect(parseCurrencyInput('0,5')).toBe(0.5);
      expect(parseCurrencyInput('1000,')).toBe(1_000);
      expect(parseCurrencyInput(',5')).toBe(0.5);
      expect(parseCurrencyInput('1.000 VNĐ')).toBe(1_000);

      // Canonical decimals
      expect(parseCurrencyInput('0.5')).toBe(0.5);
      expect(parseCurrencyInput('0.125')).toBe(0.125);
      expect(parseCurrencyInput('1.5')).toBe(1.5);
      expect(parseCurrencyInput('12.75')).toBe(12.75);
      expect(parseCurrencyInput('1000.5')).toBe(1_000.5);
      expect(parseCurrencyInput('20000.75')).toBe(20_000.75);
      expect(parseCurrencyInput('26818.181818')).toBe(26_818.181818);

      // English Excel pastes
      expect(parseCurrencyInput('1,000,000.50')).toBe(1_000_000.5);
      expect(parseCurrencyInput('1,000,000')).toBe(1_000_000);
      expect(parseCurrencyInput('1,250,000.75')).toBe(1_250_000.75);
    });
  });

  describe('formatCurrencyDraft', () => {
    it('handles empty input, zero, leading comma, and standard integer grouping', () => {
      expect(formatCurrencyDraft('', '')).toEqual({ display: '', canonical: '', numeric: 0 });
      expect(formatCurrencyDraft('   ', '')).toEqual({ display: '', canonical: '', numeric: 0 });
      expect(formatCurrencyDraft('abc', '')).toEqual({ display: '', canonical: '', numeric: 0 });

      expect(formatCurrencyDraft('0', '')).toEqual({ display: '0', canonical: '0', numeric: 0 });
      expect(formatCurrencyDraft('0,', '0')).toEqual({ display: '0,', canonical: '0', numeric: 0 });
      expect(formatCurrencyDraft('0,5', '0,')).toEqual({ display: '0,5', canonical: '0.5', numeric: 0.5 });
      expect(formatCurrencyDraft('05', '0')).toEqual({ display: '5', canonical: '5', numeric: 5 });

      expect(formatCurrencyDraft('1000', '100')).toEqual({
        display: '1.000',
        canonical: '1000',
        numeric: 1000,
      });
      expect(formatCurrencyDraft('1.0000', '1.000')).toEqual({
        display: '10.000',
        canonical: '10000',
        numeric: 10000,
      });
    });

    it('converts single-keystroke Numpad dot to Vietnamese comma and caps fraction digits', () => {
      expect(formatCurrencyDraft('.', '')).toEqual({
        display: '0,',
        canonical: '0',
        numeric: 0,
      });
      expect(formatCurrencyDraft('1.000.', '1.000')).toEqual({
        display: '1.000,',
        canonical: '1000',
        numeric: 1000,
      });
      expect(formatCurrencyDraft('1.000,5', '1.000,')).toEqual({
        display: '1.000,5',
        canonical: '1000.5',
        numeric: 1000.5,
      });
      expect(formatCurrencyDraft('1.000,50', '1.000,5')).toEqual({
        display: '1.000,50',
        canonical: '1000.5',
        numeric: 1000.5,
      });
      expect(formatCurrencyDraft('1.000,509', '1.000,50')).toEqual({
        display: '1.000,50',
        canonical: '1000.5',
        numeric: 1000.5,
      });
      expect(formatCurrencyDraft('12.3', '123')).toEqual({
        display: '12,3',
        canonical: '12.3',
        numeric: 12.3,
      });
    });

    it('handles multi-char pastes and Playwright fill() for English, canonical, and Vietnamese formats', () => {
      expect(formatCurrencyDraft('1,250,000.50', '')).toEqual({
        display: '1.250.000,5',
        canonical: '1250000.5',
        numeric: 1250000.5,
      });
      expect(formatCurrencyDraft('1,250,000', '')).toEqual({
        display: '1.250.000',
        canonical: '1250000',
        numeric: 1250000,
      });
      expect(formatCurrencyDraft('1000.5', '')).toEqual({
        display: '1.000,5',
        canonical: '1000.5',
        numeric: 1000.5,
      });
      expect(formatCurrencyDraft('1.000.000', '')).toEqual({
        display: '1.000.000',
        canonical: '1000000',
        numeric: 1000000,
      });
      expect(formatCurrencyDraft('1.000 VNĐ', '')).toEqual({
        display: '1.000',
        canonical: '1000',
        numeric: 1000,
      });
      expect(formatCurrencyDraft('1.000,50', '')).toEqual({
        display: '1.000,50',
        canonical: '1000.5',
        numeric: 1000.5,
      });
      expect(formatCurrencyDraft('0', '')).toEqual({
        display: '0',
        canonical: '0',
        numeric: 0,
      });
    });

    it('respects allowDecimals=false and clamps max without clamping min mid-typing', () => {
      expect(formatCurrencyDraft('1.000,', '1.000', { allowDecimals: false })).toEqual({
        display: '1.000',
        canonical: '1000',
        numeric: 1000,
      });
      expect(formatCurrencyDraft('1.000.', '1.000', { allowDecimals: false })).toEqual({
        display: '1.000',
        canonical: '1000',
        numeric: 1000,
      });
      expect(formatCurrencyDraft('1500000', '150000', { max: 1_000_000, min: 100_000 })).toEqual({
        display: '1.000.000',
        canonical: '1000000',
        numeric: 1000000,
      });
      // Must NOT clamp min mid-typing
      expect(formatCurrencyDraft('5', '', { min: 100_000 })).toEqual({
        display: '5',
        canonical: '5',
        numeric: 5,
      });
    });
  });
});
