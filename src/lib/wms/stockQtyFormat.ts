export function fmtStockQty(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n);
}

/** Khả dụng (kho dự án) = tồn thực tế − xuất/chuyển dự kiến */
export function computeAvailableQty(actual: number, plannedExport: number) {
  return actual - plannedExport;
}

/** Tồn dự kiến = tồn thực tế + nhập/hoàn trả/chuyển kho dự kiến (không trừ xuất DK) */
export function computePlannedStock(actual: number, plannedImport: number) {
  return actual + plannedImport;
}

export function fmtAvailableQty(actual: number, plannedExport: number) {
  const qty = computeAvailableQty(actual, plannedExport);
  if (qty === 0 && actual === 0 && plannedExport === 0) return '—';
  return fmtStockQty(qty);
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
