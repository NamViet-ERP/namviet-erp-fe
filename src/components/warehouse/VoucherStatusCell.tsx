import Badge from '../ui/Badge';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { StatusKey } from '../../types';

interface VoucherApprovalProps {
  status: StatusKey;
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
  approvedBy,
  approvedAt,
}: VoucherApprovalProps) {
  const { approver, approvedTime, showMeta } = useApprovalMeta({
    status,
    approvedBy,
    approvedAt,
  });

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <Badge status={status} />
      {showMeta && (
        <div className="max-w-[9rem] text-center text-[10px] leading-snug text-[var(--md-on-surface-variant)]">
          {approvedTime && <div className="tabular-nums">{approvedTime}</div>}
          {approver && <div className="truncate" title={approver}>{approver}</div>}
        </div>
      )}
    </div>
  );
}
