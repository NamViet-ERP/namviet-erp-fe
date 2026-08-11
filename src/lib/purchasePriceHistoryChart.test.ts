import { describe, expect, it } from 'vitest';
import {
  buildPriceHistoryChart,
  daysBetween,
  isPurchaseKind,
} from './purchasePriceHistoryChart';

describe('purchasePriceHistoryChart', () => {
  it('counts calendar days between ISO dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-11')).toBe(10);
    expect(daysBetween('bad', '2026-01-01')).toBe(0);
  });

  it('treats PO / KHMH / nhập kho as purchased points', () => {
    expect(isPurchaseKind('po')).toBe(true);
    expect(isPurchaseKind('plan')).toBe(true);
    expect(isPurchaseKind('import')).toBe(true);
    expect(isPurchaseKind('quote')).toBe(false);
    expect(isPurchaseKind('sell')).toBe(false);
  });

  it('returns null when there is no plottable history', () => {
    expect(buildPriceHistoryChart([])).toBeNull();
  });

  it('places a single point in the middle of the plot', () => {
    const chart = buildPriceHistoryChart([
      { date: '2026-08-01', kind: 'po', unitPrice: 100_000, supplierName: 'CADIVI' },
    ]);
    expect(chart).not.toBeNull();
    expect(chart!.xOf('2026-08-01')).toBeCloseTo(78 + 0.5 * (640 - 78 - 16), 5);
    expect(chart!.supplierKeys).toEqual(['CADIVI']);
  });
});
