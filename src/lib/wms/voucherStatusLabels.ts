import type { StatusKey } from '../../types';
import { statusConfig } from '../../constants/statusConfig';

export type WmsVoucherKind = 'import' | 'export' | 'transfer';

const PLANNED_LABEL: Record<WmsVoucherKind, string> = {
  import: 'Nhập dự kiến',
  export: 'Xuất dự kiến',
  transfer: 'Chuyển dự kiến',
};

const ACTUAL_LABEL: Record<WmsVoucherKind, string> = {
  import: 'Nhập thực tế',
  export: 'Xuất thực tế',
  transfer: 'Chuyển thực tế',
};

/** Label trạng thái phiếu theo loại — Pending/Approved dùng thuật ngữ dự kiến/thực tế. */
export function getVoucherStatusLabel(status: StatusKey, kind: WmsVoucherKind): string {
  if (status === 'pending') return PLANNED_LABEL[kind];
  if (status === 'approved') return ACTUAL_LABEL[kind];
  return statusConfig[status]?.label ?? status;
}

export function getVoucherTabLabels(kind: WmsVoucherKind) {
  return {
    draft: 'Nháp',
    pending: PLANNED_LABEL[kind],
    approved: ACTUAL_LABEL[kind],
  };
}
