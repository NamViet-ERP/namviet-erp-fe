import type { Export } from '../../../types';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';
import { projectInventoryAvailable } from '../../../lib/wms/stockQtyFormat';
import type { MaterialQtyLine } from '../voucher/voucherFormTypes';

export function exportStatusHint(status: Export['status'], isDirect = false) {
  if (isDirect) {
    if (status === 'pending') return 'Xuất thẳng dự kiến - chờ thủ kho duyệt thực tế, không trừ tồn kho';
    if (status === 'approved') return 'Xuất thẳng thực tế - đã giao công trường, tồn kho không tăng';
    return 'Xuất thẳng công trường';
  }
  if (status === 'draft') return 'Nháp — chưa ghi dự kiến';
  if (status === 'pending') return 'Xuất dự kiến — có thể sửa, chờ duyệt thực tế';
  if (status === 'approved') return 'Xuất thực tế — đã trừ tồn dự án, không sửa';
  return '';
}

export function exportKindLabel(exp: Export) {
  return exp.isDirectProcurement ? 'Xuất thẳng' : 'Xuất từ kho';
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
  const base = projectInventoryAvailable(row);
  const usedInForm = items.reduce((sum, it, i) => {
    if (i === lineIdx || it.materialCode !== materialCode) return sum;
    return sum + (Number(it.qty) || 0);
  }, 0);
  return Math.max(0, base - usedInForm);
}
