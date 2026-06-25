import { formatDateTimeVi } from '../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../lib/wms/voucherDateUtils';
import type { VoucherDateFields } from '../../lib/wms/voucherDateUtils';

interface VoucherCodeCellProps {
  code: string;
  voucher: VoucherDateFields & { createdBy?: string };
  showCreator?: boolean;
}

export default function VoucherCodeCell({ code, voucher, showCreator }: VoucherCodeCellProps) {
  const created = getVoucherCreatedAt(voucher);
  const createdLabel = created
    ? formatDateTimeVi(created.toISOString())
    : undefined;
  const creator = voucher.createdBy?.trim();

  return (
    <div className="min-w-0">
      <div className="font-mono text-sm font-semibold text-[var(--md-primary)] whitespace-nowrap">
        {code}
      </div>
      {createdLabel && (
        <div className="text-[10px] leading-snug text-[var(--md-on-surface-variant)] tabular-nums mt-0.5">
          {createdLabel}
        </div>
      )}
      {showCreator && creator && creator !== 'USER' && (
        <div className="text-[10px] leading-snug text-[var(--md-on-surface-variant)] truncate mt-0.5" title={creator}>
          {creator}
        </div>
      )}
    </div>
  );
}
