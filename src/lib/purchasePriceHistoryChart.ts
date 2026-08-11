export type PriceHistoryPoint = {
  date: string;
  kind: string;
  status?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  unitPrice: number;
};

export type ChartLayout = {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
};

const DEFAULT_LAYOUT: ChartLayout = {
  width: 640,
  height: 220,
  padL: 78,
  padR: 16,
  padT: 12,
  padB: 26,
};

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function isPurchaseKind(kind: string): boolean {
  return kind === 'po' || kind === 'plan' || kind === 'import';
}

export function buildPriceHistoryChart(points: PriceHistoryPoint[], layout: ChartLayout = DEFAULT_LAYOUT) {
  const priced = points.filter(p => Number.isFinite(p.unitPrice) && p.date);
  if (priced.length === 0) return null;

  const prices = priced.map(p => p.unitPrice);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05 || minP * 1.05 + 1;
  const dates = priced.map(p => p.date);
  const minD = dates.reduce((a, b) => (a < b ? a : b));
  const maxD = dates.reduce((a, b) => (a > b ? a : b));
  const spanDays = daysBetween(minD, maxD);
  const plotW = layout.width - layout.padL - layout.padR;
  const plotH = layout.height - layout.padT - layout.padB;

  const xOf = (date: string) =>
    layout.padL + (spanDays ? (daysBetween(minD, date) / spanDays) : 0.5) * plotW;
  const yOf = (price: number) =>
    layout.padT + (1 - (price - minP) / ((maxP - minP) || 1)) * plotH;

  const supplierKeys = [...new Set(priced.map(p => p.supplierName || `#${p.supplierId ?? 0}`))];

  return {
    layout,
    minP,
    midP: (minP + maxP) / 2,
    maxP,
    xOf,
    yOf,
    supplierKeys,
    axis: {
      x1: layout.padL,
      y1: layout.padT,
      x2: layout.width - layout.padR,
      y2: layout.height - layout.padB,
    },
  };
}
