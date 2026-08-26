export const ESTIMATE_STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  shared: 'Nháp (cũ)',
  submitted: 'Nháp (cũ)',
  reviewed: 'Nháp (cũ)',
  pending_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

export const ESTIMATE_STATUS_BADGE: Record<string, string> = {
  draft: 'badge-draft',
  shared: 'badge-draft',
  submitted: 'badge-draft',
  reviewed: 'badge-draft',
  pending_approval: 'badge-pending',
  approved: 'badge-success',
  rejected: 'badge-error',
};

export function estimateStatusLabel(status: string | undefined) {
  if (!status) return '-';
  return ESTIMATE_STATUS_LABEL[status] ?? status;
}

export function estimateStatusBadge(status: string | undefined) {
  if (!status) return 'badge-neutral';
  return ESTIMATE_STATUS_BADGE[status] ?? 'badge-neutral';
}

export function canEditEstimate(status: string | undefined) {
  return status === 'draft'
    || status === 'rejected'
    || status === 'shared'
    || status === 'submitted'
    || status === 'reviewed';
}

export function canSubmitEstimate(status: string | undefined) {
  return canEditEstimate(status);
}
