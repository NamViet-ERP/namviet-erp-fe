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
  if (status !== 'approved') return [];
  const approver = approvedBy?.trim();
  const approvedTime = formatDateTimeVi(approvedAt);
  const fields: VoucherDetailField[] = [];
  if (approvedTime) {
    fields.push({
      label: 'Duyệt lúc',
      value: <span className="tabular-nums">{approvedTime}</span>,
    });
  }
  if (approver) {
    fields.push({ label: 'Người duyệt', value: approver });
  }
  return fields;
}
