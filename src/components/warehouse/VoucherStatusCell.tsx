import Badge from '../ui/Badge';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { getVoucherStatusLabel, type WmsVoucherKind } from '../../lib/wms/voucherStatusLabels';
import type { StatusKey } from '../../types';

interface VoucherApprovalProps {
  status: StatusKey;
  voucherKind?: WmsVoucherKind;
  approvedBy?: string;
  approvedAt?: string;
}

function useApprovalMeta({ status, approvedBy, approvedAt }: VoucherApprovalProps) {
  const approver = approvedBy?.trim();
  const approvedTime = formatDateTimeVi(approvedAt);
  const showMeta = status === 'approved' && Boolean(approver || approvedTime);
  return { approver, approvedTime, showMeta };
}

/** Meta duyệt dạng label — dùng trong modal chi tiết. */
export function VoucherApprovalDetail({
  status,
  approvedBy,
  approvedAt,
}: VoucherApprovalProps) {
  const { approver, approvedTime, showMeta } = useApprovalMeta({
    status,
    approvedBy,
    approvedAt,
  });

  if (!showMeta) return null;

  return (
    <>
      {approvedTime && (
        <div>
          <strong>Duyệt lúc:</strong>{' '}
          <span className="tabular-nums text-[var(--md-on-surface-variant)]">{approvedTime}</span>
        </div>
      )}
      {approver && (
        <div>
          <strong>Người duyệt:</strong>{' '}
          <span className="text-[var(--md-on-surface-variant)]">{approver}</span>
        </div>
      )}
    </>
  );
}

export default function VoucherStatusCell({
  status,
  voucherKind,
  approvedBy,
  approvedAt,
}: VoucherApprovalProps) {
  const { approver, approvedTime, showMeta } = useApprovalMeta({
    status,
    approvedBy,
    approvedAt,
  });

  const label = voucherKind ? getVoucherStatusLabel(status, voucherKind) : undefined;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <Badge status={status} label={label} />
      {showMeta && (
        <div className="max-w-[9rem] text-center text-[10px] leading-snug text-[var(--md-on-surface-variant)]">
          {approvedTime && <div className="tabular-nums">{approvedTime}</div>}
          {approver && <div className="truncate" title={approver}>{approver}</div>}
        </div>
      )}
    </div>
  );
}

export function voucherStatusLabel(status: StatusKey, kind: WmsVoucherKind) {
  return getVoucherStatusLabel(status, kind);
}
