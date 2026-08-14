import { describe, expect, it } from 'vitest';
import {
  buildPriceHistoryPlot,
  daysBetween,
  isPurchaseKind,
  priceHistoryKindLabel,
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

  it('labels kinds in Vietnamese', () => {
    expect(priceHistoryKindLabel('plan')).toBe('KHMH');
    expect(priceHistoryKindLabel('sell')).toBe('Giá bán');
    expect(priceHistoryKindLabel('estimate')).toBe('Giá dự toán');
  });

  it('returns null when there is no plottable history', () => {
    expect(buildPriceHistoryPlot([])).toBeNull();
  });

  it('pads a single point so it is not stuck to the axis edge', () => {
    const plot = buildPriceHistoryPlot([
      { date: '2026-08-01', kind: 'po', unitPrice: 100_000, supplierName: 'CADIVI' },
    ]);
    expect(plot).not.toBeNull();
    expect(plot!.rows).toHaveLength(1);
    expect(plot!.rows[0].purchased).toBe(true);
    expect(plot!.rows[0].kindLabel).toBe('Đã mua (PO)');
    expect(plot!.xDomain[0]).toBeLessThan(plot!.rows[0].ts);
    expect(plot!.xDomain[1]).toBeGreaterThan(plot!.rows[0].ts);
  });

  it('sorts by date and does not invent a supplier named #0', () => {
    const plot = buildPriceHistoryPlot([
      { date: '2026-06-15', kind: 'sell', unitPrice: 98_000 },
      { date: '2026-05-25', kind: 'plan', unitPrice: 89_100, supplierName: 'CƠ KHÍ HẢI LONG' },
      { date: '2026-06-01', kind: 'estimate', unitPrice: 82_000 },
    ]);
    expect(plot!.rows.map(r => r.kind)).toEqual(['plan', 'estimate', 'sell']);
    expect(plot!.rows.map(r => r.supplierName)).toEqual(['CƠ KHÍ HẢI LONG', '', '']);
    expect(plot!.legend.map(l => l.kindLabel)).toEqual(['KHMH', 'Giá dự toán', 'Giá bán']);
  });
});
