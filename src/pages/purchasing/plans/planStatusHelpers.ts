import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { TabItem } from '../../../types';

export function planStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'pending_l1':
      return 'Chờ duyệt cấp 1';
    case 'pending_l2':
      return 'Chờ duyệt cấp 2';
    case 'approved':
    case 'active':
      return 'Đã duyệt';
    case 'rejected':
      return 'Từ chối';
    case 'closed':
      return 'Đã đóng';
    default:
      return status || '-';
  }
}

export function planStatusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
    case 'active':
      return 'pur-erp__pill pur-erp__pill--ok';
    case 'rejected':
    case 'closed':
      return 'pur-erp__pill pur-erp__pill--danger';
    case 'pending_l1':
    case 'pending_l2':
      return 'pur-erp__pill pur-erp__pill--warn';
    default:
      return 'pur-erp__pill pur-erp__pill--warn';
  }
}

/** Meta duyệt cuối (C2 ưu tiên, fallback C1) — giống cột trạng thái phiếu nhập. */
export function planApprovalMeta(row: {
  status?: string | null;
  l1ApprovedByName?: string | null;
  l1ApprovedAt?: string | null;
  l2ApprovedByName?: string | null;
  l2ApprovedAt?: string | null;
}) {
  const isApproved = row.status === 'approved' || row.status === 'active';
  if (!isApproved) return null;
  const approver = (row.l2ApprovedByName || row.l1ApprovedByName)?.trim() || '';
  const approvedAt = row.l2ApprovedAt || row.l1ApprovedAt;
  const approvedTime = formatDateTimeVi(approvedAt ?? undefined);
  if (!approver && !approvedTime) return null;
  return { approver, approvedTime };
}

export const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Nháp' },
  { id: 'pending_l1', label: 'Duyệt cấp 1' },
  { id: 'pending_l2', label: 'Duyệt cấp 2' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'rejected', label: 'Từ chối' },
  { id: 'closed', label: 'Đã đóng' },
];
