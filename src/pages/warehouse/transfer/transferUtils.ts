import type { Transfer } from '../../../types';
import type { WarehouseProjectInventoryApiDto } from '../../../types/wms';
import { GENERAL_WAREHOUSE_LABEL, GENERAL_WAREHOUSE_LABEL_LOWER } from '../../../lib/wms/stockTerminology';
import { projectInventoryAvailable } from '../../../lib/wms/stockQtyFormat';
import type { MaterialQtyLine, MaterialQtyPhaseLine } from '../voucher/voucherFormTypes';

export type TransferMode = 'return' | 'cross-project';

export function transferStatusHint(status: Transfer['status'], isCrossProject: boolean) {
  if (status === 'draft') return 'Nháp — chưa ghi dự kiến';
  if (status === 'pending') return 'Chuyển dự kiến — có thể sửa, chờ duyệt thực tế';
  if (status === 'approved') {
    return isCrossProject
      ? 'Chuyển thực tế — đã chuyển sang kho dự án đích'
      : `Chuyển thực tế — đã hoàn về ${GENERAL_WAREHOUSE_LABEL_LOWER}`;
  }
  return '';
}

export function destinationLabel(tf: Transfer) {
  if (tf.toProjectName) return tf.toProjectName;
  if (tf.toProject) return tf.toProject;
  return tf.toWarehouseName || GENERAL_WAREHOUSE_LABEL;
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
  const base = projectInventoryAvailable(row);
  const usedInForm = items.reduce((sum, it, i) => {
    if (i === lineIdx || it.materialCode !== materialCode) return sum;
    return sum + (Number(it.qty) || 0);
  }, 0);
  return Math.max(0, base - usedInForm);
}

export type { MaterialQtyPhaseLine };
