import { describe, expect, it } from 'vitest';
import { formatDateCell, formatDateVi } from './dates';
import { formatCurrency, parseCurrencyInput } from './currency';

describe('lib/format', () => {
  it('formats ISO dates as dd/MM/yyyy', () => {
    expect(formatDateVi('2026-08-27')).toBe('27/08/2026');
    expect(formatDateCell(undefined)).toBe('—');
  });

  it('parses and formats VND input', () => {
    expect(parseCurrencyInput('1.000.000')).toBe(1000000);
    expect(formatCurrency(1000000)).toBe('1.000.000');
  });
});
