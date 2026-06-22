import type { Export } from '../../../types';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';
import type { MaterialQtyLine } from '../voucher/voucherFormTypes';

export function exportStatusHint(status: Export['status']) {
  if (status === 'draft') return 'Nháp — ghi dự kiến xuất dự án';
  if (status === 'pending') return 'Chờ thủ kho duyệt';
  if (status === 'approved') return 'Đã trừ tồn thực tế dự án';
  return '';
}

export function exportProjectLabel(exp: Export) {
  return exp.projectName || exp.warehouseName || exp.project || '—';
}

export function inventoryRow(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
) {
  return inventory.find(r => r.materialCode === materialCode);
}

export function availableExportQty(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
  items: MaterialQtyLine[],
  lineIdx: number,
) {
  const row = inventoryRow(inventory, materialCode);
  if (!row) return 0;
  const base = row.actualInventoryQty - row.plannedExportQty;
  const usedInForm = items.reduce((sum, it, i) => {
    if (i === lineIdx || it.materialCode !== materialCode) return sum;
    return sum + (Number(it.qty) || 0);
  }, 0);
  return Math.max(0, base - usedInForm);
}
