import type { Transfer } from '../../../types';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';
import type { MaterialQtyLine, MaterialQtyPhaseLine } from '../voucher/voucherFormTypes';

export type TransferMode = 'return' | 'cross-project';

export function transferStatusHint(status: Transfer['status'], isCrossProject: boolean) {
  if (status === 'draft') return 'Nháp — giữ tồn khả dụng dự án';
  if (status === 'pending') return 'Đã duyệt dự kiến — chờ thủ kho duyệt kho';
  if (status === 'approved') return isCrossProject ? 'Đã duyệt kho — chuyển sang kho dự án đích' : 'Đã duyệt kho — hoàn về kho tổng';
  return '';
}

export function destinationLabel(tf: Transfer) {
  if (tf.toProjectName) return tf.toProjectName;
  if (tf.toProject) return tf.toProject;
  return tf.toWarehouseName || 'Kho tổng';
}

export function isCrossProjectTransfer(tf: Transfer) {
  return Boolean(tf.toProject);
}

export function transferProjectLabel(tf: Transfer) {
  return tf.projectName || tf.fromWarehouseName || tf.project || '—';
}

export function inventoryRow(
  inventory: WarehouseProjectInventoryApiDto[],
  materialCode: string,
) {
  return inventory.find(r => r.materialCode === materialCode);
}

export function availableReturnQty(
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

export type { MaterialQtyPhaseLine };
