export type PoPillTone = 'ok' | 'warn' | 'danger' | 'neutral' | 'info';

export function poApprovalStatus(v: string | null | undefined): { label: string; tone: PoPillTone } {
  switch (v) {
    case 'approved':
      return { label: 'Đã duyệt', tone: 'ok' };
    case 'draft':
      return { label: 'Chưa duyệt', tone: 'warn' };
    default:
      return { label: v || '—', tone: 'neutral' };
  }
}

export function poPlacementStatus(v: string | null | undefined): { label: string; tone: PoPillTone } {
  switch (v) {
    case 'placed':
      return { label: 'Đã đặt', tone: 'ok' };
    case 'not_placed':
      return { label: 'Chưa đặt', tone: 'warn' };
    default:
      return { label: v || '—', tone: 'neutral' };
  }
}

export function poDeliveryStatus(v: string | null | undefined): { label: string; tone: PoPillTone } {
  switch (v) {
    case 'complete':
      return { label: 'Đủ', tone: 'ok' };
    case 'partial':
      return { label: '1 phần', tone: 'info' };
    case 'none':
      return { label: 'Chưa giao', tone: 'warn' };
    default:
      return { label: v || '—', tone: 'neutral' };
  }
}

export function poPaymentStatus(v: string | null | undefined): { label: string; tone: PoPillTone } {
  switch (v?.trim().toLowerCase()) {
    case 'paid':
    case 'completed':
    case 'đã thanh toán':
      return { label: 'Đã thanh toán', tone: 'ok' };
    case 'partial':
      return { label: 'Thanh toán 1 phần', tone: 'info' };
    case 'unpaid':
      return { label: 'Chưa thanh toán', tone: 'warn' };
    case 'overdue':
      return { label: 'Quá hạn', tone: 'danger' };
    default:
      return { label: v || '—', tone: 'neutral' };
  }
}

export function poPaymentWarningStatus(warning: boolean): { label: string; tone: PoPillTone } {
  return warning
    ? { label: 'Có cảnh báo', tone: 'danger' }
    : { label: 'Không', tone: 'neutral' };
}

const PILL_TONE_CLASS: Record<PoPillTone, string> = {
  ok: 'pur-erp__pill--ok',
  warn: 'pur-erp__pill--warn',
  danger: 'pur-erp__pill--danger',
  info: 'pur-erp__pill--info',
  neutral: 'pur-erp__pill--neutral',
};

export function PoStatusPill({ label, tone }: { label: string; tone: PoPillTone }) {
  if (label === '—') return <span className="pur-erp__status-empty">—</span>;
  return (
    <span className={`pur-erp__pill ${PILL_TONE_CLASS[tone]}`}>
      {label}
    </span>
  );
}
