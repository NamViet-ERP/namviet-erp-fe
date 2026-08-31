import type { MouseEvent } from 'react';
import EntityCodeLink from '../ui/EntityCodeLink';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../lib/wms/voucherDateUtils';
import type { VoucherDateFields } from '../../lib/wms/voucherDateUtils';

interface VoucherCodeCellProps {
  code: string;
  voucher: VoucherDateFields & { createdBy?: string };
  showCreator?: boolean;
  onCodeClick?: (e: MouseEvent) => void;
  to?: string;
}

export default function VoucherCodeCell({
  code,
  voucher,
  showCreator,
  onCodeClick,
  to,
}: VoucherCodeCellProps) {
  const created = getVoucherCreatedAt(voucher);
  const createdLabel = created
    ? formatDateTimeVi(created.toISOString())
    : undefined;
  const creator = voucher.createdBy?.trim();
  const clickable = Boolean(to || onCodeClick);

  return (
    <div className="min-w-0">
      {clickable ? (
        <EntityCodeLink code={code} to={to} onClick={onCodeClick} className="whitespace-nowrap" />
      ) : (
        <span className="entity-code whitespace-nowrap">{code}</span>
      )}
      {createdLabel && (
        <div className="text-[length:var(--fs-micro)] leading-snug text-[var(--md-on-surface-variant)] tabular-nums mt-0.5">
          {createdLabel}
        </div>
      )}
      {showCreator && creator && creator !== 'USER' && (
        <div className="text-[length:var(--fs-micro)] leading-snug text-[var(--md-on-surface-variant)] truncate mt-0.5" title={creator}>
          {creator}
        </div>
      )}
    </div>
  );
}
