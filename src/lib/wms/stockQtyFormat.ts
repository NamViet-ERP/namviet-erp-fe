export function fmtStockQty(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

/** Tồn dự kiến = tồn thực tế + nhập dự kiến */
export function computePlannedStock(actual: number, plannedImport: number) {
  return actual + plannedImport;
}

export function fmtPlannedStock(actual: number, plannedImport: number) {
  const total = computePlannedStock(actual, plannedImport);
  if (total === 0 && actual === 0 && plannedImport === 0) return '—';
  return fmtStockQty(total);
}

export function fmtStockQtyOrDash(n: number) {
  if (n === 0) return '—';
  return fmtStockQty(n);
}

/** @deprecated Prefer fmtStockQtyOrDash — planned qty shown as plain number, not +prefix */
export function fmtStockPlanned(n: number) {
  return fmtStockQtyOrDash(n);
}
