import type { StockMatrixRowApiDto } from '../../types/wms';
import {
  computeExpectedStock,
  computePlannedNet,
  fmtExpectedStock,
  fmtPlannedNet,
  fmtStockQtyOrDash,
} from './stockQtyFormat';
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
    (sum, p) => sum + Math.max(0, p.actualQty - p.plannedExportQty),
    0,
  );
}

/** Khả dụng = (Kho trung tâm − giữ) + Σ max(0, tồn TT − xuất DK) từng dự án */
export function totalUsableQty(row: StockMatrixRowApiDto) {
  const generalFree = Math.max(0, row.generalActualQty - row.generalReservedQty);
  return generalFree + sumProjectAvailable(row);
}

export function projectPlannedNet(row: StockMatrixRowApiDto) {
  return computePlannedNet(sumProjectPlannedImport(row), sumProjectPlannedExport(row));
}

export function projectExpectedStock(row: StockMatrixRowApiDto) {
  return computeExpectedStock(
    sumProjectActual(row),
    sumProjectPlannedImport(row),
    sumProjectPlannedExport(row),
  );
}

export function countActiveProjects(row: StockMatrixRowApiDto) {
  return row.projects.filter(
    p => p.actualQty !== 0 || p.plannedImportQty !== 0 || p.plannedExportQty !== 0,
  ).length;
}

export { STOCK_FORMULA_LEGEND };
