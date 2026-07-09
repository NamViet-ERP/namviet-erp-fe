import type { ExportReturnableLine, ExportReturnItem } from '../../../types';

export interface ExportReturnFormLine extends ExportReturnableLine {
  returnQty: string;
}

export function linesToFormLines(lines: ExportReturnableLine[]): ExportReturnFormLine[] {
  return lines.map(line => ({
    ...line,
    returnQty: String(line.remainingQty),
  }));
}

export function mergeEditFormLines(
  returnableLines: ExportReturnableLine[],
  editingItems: ExportReturnItem[],
): ExportReturnFormLine[] {
  const bySku = new Map(returnableLines.map(line => [line.sku, line]));
  const skus = new Set([
    ...returnableLines.map(line => line.sku),
    ...editingItems.map(item => item.sku),
  ]);

  return [...skus].map(sku => {
    const line = bySku.get(sku);
    const item = editingItems.find(i => i.sku === sku);
    if (line) {
      return {
        ...line,
        returnQty: item ? String(item.qty) : String(line.remainingQty),
      };
    }
    return {
      productId: item!.productId,
      sku,
      name: item!.name,
      unit: item!.unit,
      exportedQty: item!.qty,
      returnedQty: 0,
      remainingQty: item!.qty,
      returnQty: String(item!.qty),
    };
  });
}
