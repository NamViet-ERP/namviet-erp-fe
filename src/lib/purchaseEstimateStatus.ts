export const ESTIMATE_STATUS_LABEL: Record<string, string> = {
  draft: 'Đã tạo mẫu - chưa gửi link',
  shared: 'Đã gửi link - chờ điền',
  submitted: 'Đã nhận - chờ SC kiểm tra',
  reviewed: 'Đã kiểm tra - chờ gửi duyệt',
  pending_approval: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

export const ESTIMATE_STATUS_BADGE: Record<string, string> = {
  draft: 'badge-draft',
  shared: 'badge-info',
  submitted: 'badge-warning',
  reviewed: 'badge-warning',
  pending_approval: 'badge-pending',
  approved: 'badge-success',
  rejected: 'badge-error',
};

export function estimateStatusLabel(status: string | undefined) {
  if (!status) return '—';
  return ESTIMATE_STATUS_LABEL[status] ?? status;
}

export function estimateStatusBadge(status: string | undefined) {
  if (!status) return 'badge-neutral';
  return ESTIMATE_STATUS_BADGE[status] ?? 'badge-neutral';
}

export function canShareEstimate(status: string | undefined) {
  return status === 'draft' || status === 'shared' || status === 'submitted';
}

export function canEditEstimate(status: string | undefined) {
  return status === 'draft' || status === 'shared' || status === 'submitted' || status === 'reviewed';
}
