export type WarrantyPageTab = 'registry' | 'complaints';

export const WARRANTY_PAGE_TABS: { id: WarrantyPageTab; label: string }[] = [
  { id: 'registry', label: 'Danh mục bảo hành' },
  { id: 'complaints', label: 'Khiếu nại bảo hành' },
];

export const WARRANTY_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending_anchor', label: 'Chờ mốc' },
  { value: 'active', label: 'Còn hạn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'void', label: 'Đã hủy' },
];

export const CLAIM_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp' },
  { value: 'submitted', label: 'Đã gửi' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export const DEFECT_TYPE_OPTIONS = [
  { value: 'physical', label: 'Lỗi vật lý' },
  { value: 'spec', label: 'Sai thông số kỹ thuật' },
  { value: 'functional', label: 'Hỏng chức năng' },
];

export const SEVERITY_OPTIONS = [
  { value: 'high', label: 'Nghiêm trọng' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Nhẹ' },
];

export function statusTone(status: string): 'ok' | 'warn' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'ok';
    case 'pending_anchor':
    case 'submitted':
      return 'warn';
    case 'expired':
    case 'void':
    case 'cancelled':
      return 'danger';
    case 'closed':
      return 'ok';
    default:
      return 'neutral';
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'pending_anchor':
      return 'Chờ mốc';
    case 'active':
      return 'Còn hạn';
    case 'expired':
      return 'Hết hạn';
    case 'void':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function claimStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'submitted':
      return 'Đã gửi';
    case 'closed':
      return 'Đã đóng';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function claimKindLabel(kind: string): string {
  return kind === 'complaint' ? 'Khiếu nại' : 'Bảo hành';
}

export function defectTypeLabel(type: string | null | undefined): string {
  return DEFECT_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type ?? '-';
}

export function severityLabel(severity: string | null | undefined): string {
  return SEVERITY_OPTIONS.find(o => o.value === severity)?.label ?? severity ?? '-';
}

export function severityTone(severity: string | null | undefined): 'ok' | 'warn' | 'danger' | 'neutral' {
  switch (severity) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warn';
    case 'low':
      return 'ok';
    default:
      return 'neutral';
  }
}

export function anchorLabel(anchor: string): string {
  return anchor === 'acceptance' ? 'Nghiệm thu' : 'Giao hàng';
}

export function isWarrantyPageTab(value: string | null): value is WarrantyPageTab {
  return WARRANTY_PAGE_TABS.some(t => t.id === value);
}
