import Badge from '../ui/Badge';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import type { StatusKey } from '../../types';

interface VoucherApprovalProps {
  status: StatusKey;
  approvedBy?: string;
  approvedAt?: string;
}

function useApprovalMeta({ status, approvedBy, approvedAt }: VoucherApprovalProps) {
  const actor = approvedBy?.trim();
  const actionTime = formatDateTimeVi(approvedAt);
  const showMeta = (status === 'approved' || status === 'rejected') && Boolean(actor || actionTime);
  return { actor, actionTime, showMeta };
}

/** Meta duyệt dạng label — dùng trong modal chi tiết. */
export function VoucherApprovalDetail({
  status,
  approvedBy,
  approvedAt,
}: VoucherApprovalProps) {
  const { actor, actionTime, showMeta } = useApprovalMeta({
    status,
    approvedBy,
    approvedAt,
  });

  if (!showMeta) return null;

  const timeLabel = status === 'rejected' ? 'Từ chối lúc' : 'Duyệt lúc';
  const actorLabel = status === 'rejected' ? 'Người từ chối' : 'Người duyệt';

  return (
    <>
      {actionTime && (
        <div>
          <strong>{timeLabel}:</strong>{' '}
          <span className="tabular-nums text-[var(--md-on-surface-variant)]">{actionTime}</span>
        </div>
      )}
      {actor && (
        <div>
          <strong>{actorLabel}:</strong>{' '}
          <span className="text-[var(--md-on-surface-variant)]">{actor}</span>
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
  const { actor, actionTime, showMeta } = useApprovalMeta({
    status,
    approvedBy,
    approvedAt,
  });

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <Badge status={status} />
      {showMeta && (
        <div className="max-w-[9rem] text-center text-[10px] leading-snug text-[var(--md-on-surface-variant)]">
          {actionTime && <div className="tabular-nums">{actionTime}</div>}
          {actor && <div className="truncate" title={actor}>{actor}</div>}
        </div>
      )}
    </div>
  );
}
