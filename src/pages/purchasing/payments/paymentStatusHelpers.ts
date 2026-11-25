import { formatDateTimeVi } from '../../../lib/hrm/formatters';

export function paymentStatusLabel(status: string | null | undefined): string {
  switch (status?.trim().toLowerCase()) {
    case 'draft':
      return 'Nháp';
    case 'submitted':
      return 'Đã gửi';
    case 'paid':
    case 'completed':
      return 'Đã thanh toán';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || '-';
  }
}

export function paymentStatusBadgeClass(status: string | null | undefined): string {
  switch (status?.trim().toLowerCase()) {
    case 'paid':
    case 'completed':
      return 'badge badge-success';
    case 'cancelled':
      return 'badge badge-error';
    case 'submitted':
      return 'badge badge-info';
    default:
      return 'badge badge-warning';
  }
}

export function paymentDetailSubtitle(payment: {
  status?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
} | undefined): string {
  if (!payment) return '';
  if (payment.status === 'paid') {
    return [
      paymentStatusLabel(payment.status),
      formatDateTimeVi(payment.paidAt ?? undefined),
      payment.paidByName?.trim() || undefined,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return `${paymentStatusLabel(payment.status)}${payment.createdAt ? ` · ${formatDateTimeVi(payment.createdAt)}` : ''}`;
}
