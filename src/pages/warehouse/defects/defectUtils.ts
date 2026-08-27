import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import type { StatusKey } from '../../../types';
import type { DefectTab } from './defectTypes';

export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function statusLabel(status: string) {
  if (status === 'draft') return 'Nháp';
  if (status === 'pending') return 'Chờ duyệt';
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Đã hủy';
  return status;
}

/** Nhãn badge trên chi tiết phiếu (gồm phase xử lý sau duyệt). */
export function defectDetailBadgeLabel(row: PurchaseDefectApiDto): string {
  if (row.status === 'approved') {
    if (row.processingPhase === 'processing') return 'Đang xử lý';
    if (row.processingPhase === 'processed') return 'Đã xử lý';
    return 'Đã duyệt';
  }
  return statusLabel(row.status);
}

/** Tone badge khớp nhãn (Đang xử lý dùng pending). */
export function defectDetailBadgeStatus(row: PurchaseDefectApiDto): StatusKey {
  if (row.status === 'approved' && row.processingPhase === 'processing') return 'pending';
  return toStatusKey(row.status);
}

export function defectStatusHint(row: PurchaseDefectApiDto): string {
  if (row.status === 'draft') return 'Bổ sung ảnh và lý do trước khi gửi duyệt';
  if (row.status === 'pending') {
    return row.sourceType === 'stock'
      ? 'Duyệt sẽ trừ tồn thực tế dự án'
      : 'Duyệt cập nhật PO/KHMH - không cộng tồn';
  }
  if (row.status === 'approved') return 'Đã duyệt - chỉ xem';
  if (row.status === 'rejected') return 'Phiếu đã hủy';
  return '';
}

export function toStatusKey(status: string): StatusKey {
  if (
    status === 'draft'
    || status === 'pending'
    || status === 'approved'
    || status === 'rejected'
  ) {
    return status;
  }
  return 'pending';
}

export function matchesTab(row: PurchaseDefectApiDto, tab: DefectTab): boolean {
  switch (tab) {
    case 'draft':
      return row.status === 'draft';
    case 'pending':
      return row.status === 'pending';
    case 'approved':
      return row.status === 'approved' && row.processingPhase === 'approved';
    case 'processing':
      return row.status === 'approved' && row.processingPhase === 'processing';
    case 'processed':
      return row.status === 'approved' && row.processingPhase === 'processed';
    case 'rejected':
      return row.status === 'rejected';
    default:
      return true;
  }
}

export function causeSourceLabel(causeSource: string | null | undefined): string {
  if (causeSource === 'customer') return 'Khách hàng';
  if (causeSource === 'supplier') return 'NCC';
  return '-';
}

export function handlingMethodLabel(handlingMethod: string | null | undefined): string {
  if (handlingMethod === 'warranty_repair') return 'Bảo hành sửa chữa';
  if (handlingMethod === 'replace') return 'Đổi mới';
  return '-';
}
