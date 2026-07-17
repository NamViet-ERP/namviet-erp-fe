import type { StockMatrixRowApiDto } from '../../types/wms';
import { computeAvailableQty, computePlannedStock } from './stockQtyFormat';
import { STOCK_FORMULA_LEGEND } from './stockTerminology';

export function sumProjectActual(row: StockMatrixRowApiDto) {
  return row.projects.reduce((sum, p) => sum + p.actualQty, 0);
}

export function sumProjectPlannedImport(row: StockMatrixRowApiDto) {
  return row.projects.reduce((sum, p) => sum + p.plannedImportQty, 0);
}

export function sumProjectPlannedExport(row: StockMatrixRowApiDto) {
  return row.projects.reduce((sum, p) => sum + p.plannedExportQty, 0);
}

export function sumProjectAvailable(row: StockMatrixRowApiDto) {
  return row.projects.reduce(
    (sum, p) => sum + computeAvailableQty(p.actualQty, p.plannedExportQty),
    0,
  );
}

/** Khả dụng tổng = (Kho trung tâm − giữ) + Σ(Tồn TT − xuất/CK DK) từng dự án */
export function totalUsableQty(row: StockMatrixRowApiDto) {
  const generalFree = row.generalActualQty - row.generalReservedQty;
  return generalFree + sumProjectAvailable(row);
}

/** Tồn dự kiến (tổng dự án) = Σ tồn TT + nhập DK */
export function projectPlannedStock(row: StockMatrixRowApiDto) {
  return computePlannedStock(sumProjectActual(row), sumProjectPlannedImport(row));
}

export function countActiveProjects(row: StockMatrixRowApiDto) {
  return row.projects.filter(
    p => p.actualQty !== 0 || p.plannedImportQty !== 0 || p.plannedExportQty !== 0,
  ).length;
}

export { STOCK_FORMULA_LEGEND };
