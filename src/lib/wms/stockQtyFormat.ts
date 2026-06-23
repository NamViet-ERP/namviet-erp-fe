export function fmtStockQty(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

export function fmtStockPlanned(n: number) {
  if (n === 0) return '—';
  return n > 0 ? `+${fmtStockQty(n)}` : fmtStockQty(n);
}
