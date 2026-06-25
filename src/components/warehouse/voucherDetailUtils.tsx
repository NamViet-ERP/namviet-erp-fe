import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { ReactNode } from 'react';
import type { StatusKey } from '../../types';

export interface VoucherDetailField {
  label: string;
  value: ReactNode;
  wide?: boolean;
}

export function displayValue(value?: string | null) {
  const text = value?.trim();
  if (!text) {
    return <span className="md-detail-field__value--muted">—</span>;
  }
  return text;
}

export function buildApprovalFields(
  status: StatusKey,
  approvedBy?: string,
  approvedAt?: string,
): VoucherDetailField[] {
  if (status !== 'approved' && status !== 'rejected') return [];
  const actor = approvedBy?.trim();
  const actionTime = formatDateTimeVi(approvedAt);
  const timeLabel = status === 'rejected' ? 'Từ chối lúc' : 'Duyệt lúc';
  const actorLabel = status === 'rejected' ? 'Người từ chối' : 'Người duyệt';
  const fields: VoucherDetailField[] = [];
  if (actionTime) {
    fields.push({
      label: timeLabel,
      value: <span className="tabular-nums">{actionTime}</span>,
    });
  }
  if (actor) {
    fields.push({ label: actorLabel, value: actor });
  }
  return fields;
}
