export type PriceHistoryPoint = {
  date: string;
  kind: string;
  status?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  unitPrice: number;
  poRef?: string | null;
  projectCode?: string | null;
};

export type PriceHistoryPlotPoint = {
  ts: number;
  date: string;
  unitPrice: number;
  purchasePrice: number | null;
  kind: string;
  status?: string | null;
  kindLabel: string;
  purchased: boolean;
  supplierName: string;
  color: string;
  poRef?: string | null;
  projectCode?: string | null;
};

const DAY_MS = 86_400_000;

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / DAY_MS);
}

export function isPurchaseKind(kind: string): boolean {
  return kind === 'po' || kind === 'plan' || kind === 'import';
}

export function priceHistoryKindLabel(kind: string, status?: string | null): string {
  if (kind === 'po') return 'Đã mua (PO)';
  if (kind === 'plan') return 'KHMH';
  if (kind === 'import') return 'Nhập kho';
  if (kind === 'sell') return 'Giá bán';
  if (kind === 'estimate') return 'Giá dự toán';
  if (status === 'won') return 'Báo giá - Thắng';
  if (status === 'lost') return 'Báo giá - Thua';
  if (status === 'active') return 'Báo giá - Còn hiệu lực';
  if (status === 'expired') return 'Báo giá - Hết hạn';
  return 'Báo giá';
}

export function priceHistoryKindColor(kind: string): string {
  if (kind === 'po' || kind === 'plan' || kind === 'import') return 'var(--md-tertiary)';
  if (kind === 'sell') return 'var(--md-secondary)';
  if (kind === 'estimate') return 'var(--md-on-surface-variant)';
  return 'var(--md-info)';
}

function pointTs(date: string): number {
  const ts = Date.parse(date);
  return Number.isFinite(ts) ? ts : 0;
}

export function buildPriceHistoryPlot(points: PriceHistoryPoint[]) {
  const priced = points.filter(p => Number.isFinite(p.unitPrice) && p.date);
  if (priced.length === 0) return null;

  const rows: PriceHistoryPlotPoint[] = priced
    .map(p => {
      const purchased = isPurchaseKind(p.kind);
      return {
        ts: pointTs(p.date),
        date: p.date,
        unitPrice: p.unitPrice,
        purchasePrice: purchased ? p.unitPrice : null,
        kind: p.kind,
        status: p.status,
        kindLabel: priceHistoryKindLabel(p.kind, p.status),
        purchased,
        supplierName: p.supplierName?.trim() || '',
        color: priceHistoryKindColor(p.kind),
        poRef: p.poRef,
        projectCode: p.projectCode,
      };
    })
    .sort((a, b) => a.ts - b.ts || a.unitPrice - b.unitPrice);

  const prices = rows.map(r => r.unitPrice);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const yPad = Math.max((maxP - minP) * 0.18, minP * 0.08, 1_000);
  const minTs = rows[0].ts;
  const maxTs = rows[rows.length - 1].ts;
  const xPad = minTs === maxTs ? DAY_MS * 10 : Math.max((maxTs - minTs) * 0.12, DAY_MS * 3);

  const legend = [...new Map(rows.map(r => [r.kindLabel, { kindLabel: r.kindLabel, color: r.color, purchased: r.purchased }])).values()];

  return {
    rows,
    legend,
    xDomain: [minTs - xPad, maxTs + xPad] as [number, number],
    yDomain: [Math.max(0, minP - yPad), maxP + yPad] as [number, number],
    xTicks: [...new Set(rows.map(r => r.ts))],
  };
}
