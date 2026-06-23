import type { StockMatrixRowApiDto } from '../types/wms';

/** Phần lấy từ kho tổng vs mua NCC khi tạo phiếu nhập dự án. */
export function splitImportQty(
  qty: number,
  materialCode: string,
  matrix: StockMatrixRowApiDto[],
) {
  if (qty <= 0 || !materialCode) {
    return { available: 0, fromGeneral: 0, fromSupplier: 0 };
  }
  const available = generalAvailableQty(materialCode, matrix);
  const fromGeneral = Math.min(qty, available);
  return {
    available,
    fromGeneral,
    fromSupplier: qty - fromGeneral,
  };
}

export function generalAvailableQty(materialCode: string, matrix: StockMatrixRowApiDto[]) {
  const row = matrix.find(r => r.materialCode === materialCode);
  if (!row) return 0;
  if (typeof row.generalAvailableQty === 'number') {
    return Math.max(0, row.generalAvailableQty);
  }
  return Math.max(0, row.generalActualQty - row.generalReservedQty);
}

export type ImportLineSource = 'stock' | 'purchase';

export interface ImportFormLine {
  materialCode: string;
  qty: string;
  lineType: ImportLineSource;
}

/** Tổng SL các dòng lấy kho tổng cùng mã VT (trừ dòng excludeIndex). */
export function stockQtyUsedForMaterial(
  items: ImportFormLine[],
  materialCode: string,
  excludeIndex?: number,
) {
  return items.reduce((sum, it, i) => {
    if (i === excludeIndex) return sum;
    if (it.materialCode !== materialCode || it.lineType !== 'stock') return sum;
    return sum + (Number(it.qty) || 0);
  }, 0);
}

/** SL tối đa trên một dòng lấy kho tổng. */
export function maxStockQtyForLine(
  items: ImportFormLine[],
  lineIndex: number,
  matrix: StockMatrixRowApiDto[],
) {
  const line = items[lineIndex];
  if (!line || line.lineType !== 'stock' || !line.materialCode) return Infinity;
  const available = generalAvailableQty(line.materialCode, matrix);
  const usedByOthers = stockQtyUsedForMaterial(items, line.materialCode, lineIndex);
  return Math.max(0, available - usedByOthers);
}

/** Tồn KT còn lại sau khi trừ SL các dòng lấy kho tổng (preview UI). */
export function previewGeneralRemaining(
  materialCode: string,
  lineQtys: number[],
  matrix: StockMatrixRowApiDto[],
) {
  const available = generalAvailableQty(materialCode, matrix);
  const usedQty = lineQtys.reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
  return Math.max(0, available - usedQty);
}

export function previewStockRemainingForMaterial(
  items: ImportFormLine[],
  materialCode: string,
  matrix: StockMatrixRowApiDto[],
) {
  const stockQtys = items
    .filter(it => it.materialCode === materialCode && it.lineType === 'stock')
    .map(it => Number(it.qty) || 0);
  return previewGeneralRemaining(materialCode, stockQtys, matrix);
}
