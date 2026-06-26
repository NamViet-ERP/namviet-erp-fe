export function fmtStockQty(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

/** Tồn dự kiến (net) = nhập dự kiến − xuất dự kiến */
export function computePlannedNet(plannedImport: number, plannedExport: number) {
  return plannedImport - plannedExport;
}

/** Tồn kỳ vọng = tồn thực tế + tồn dự kiến net */
export function computeExpectedStock(actual: number, plannedImport: number, plannedExport: number) {
  return actual + computePlannedNet(plannedImport, plannedExport);
}

export function fmtPlannedNet(plannedImport: number, plannedExport: number) {
  const net = computePlannedNet(plannedImport, plannedExport);
  if (net === 0 && plannedImport === 0 && plannedExport === 0) return '—';
  return fmtStockQty(net);
}

export function fmtExpectedStock(actual: number, plannedImport: number, plannedExport: number) {
  const total = computeExpectedStock(actual, plannedImport, plannedExport);
  if (total === 0 && actual === 0 && plannedImport === 0 && plannedExport === 0) return '—';
  return fmtStockQty(total);
}

/** @deprecated Use fmtExpectedStock — kept for project detail until aligned */
export function computePlannedStock(actual: number, plannedImport: number) {
  return actual + plannedImport;
}

/** @deprecated Use fmtExpectedStock */
export function fmtPlannedStock(actual: number, plannedImport: number) {
  return fmtExpectedStock(actual, plannedImport, 0);
}

export function fmtStockQtyOrDash(n: number) {
  if (n === 0) return '—';
  return fmtStockQty(n);
}

/** Signed diff for stocktake: actual − system */
export function computeStocktakeDiff(systemQty: number, actualQty: number) {
  return actualQty - systemQty;
}

export function fmtStocktakeDiff(systemQty: number, actualQty: number) {
  const diff = computeStocktakeDiff(systemQty, actualQty);
  if (Number.isNaN(diff)) return '—';
  if (diff === 0) return '0';
  if (diff > 0) return `+${fmtStockQty(diff)}`;
  return fmtStockQty(diff);
}

/** @deprecated Prefer fmtStockQtyOrDash */
export function fmtStockPlanned(n: number) {
  return fmtStockQtyOrDash(n);
}
