import type { Export } from '../../../types';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import VoucherDetailFooter from '../../../components/warehouse/VoucherDetailFooter';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import { exportProjectLabel, exportStatusHint } from './exportUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';

interface ExportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Export | null;
  isSubmitPending: boolean;
  isApprovePending: boolean;
  onSubmit: (exp: Export) => void;
  onApprove: (exp: Export) => void;
}

export default function ExportDetailModal({
  isOpen,
  onClose,
  selected,
  isSubmitPending,
  isApprovePending,
  onSubmit,
  onApprove,
}: ExportDetailModalProps) {
  if (!selected) return null;

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind="export"
      statusHint={exportStatusHint(selected.status)}
      approvedBy={selected.approvedBy}
      approvedAt={selected.approvedAt}
      fields={[
        { label: 'Kho dự án', value: exportProjectLabel(selected) },
        { label: 'Mã tham chiếu', value: displayValue(selected.soCode) },
        {
          label: 'Tạo lúc',
          value: displayValue(formatDateTimeVi(getVoucherCreatedAt(selected)?.toISOString())),
        },
        { label: 'Người lập', value: displayValue(selected.createdBy) },
        { label: 'Ghi chú', value: displayValue(selected.note), wide: true },
      ]}
      footer={
        <VoucherDetailFooter
          status={selected.status}
          isSubmitPending={isSubmitPending}
          isApprovePending={isApprovePending}
          onSubmit={() => onSubmit(selected)}
          onApprove={() => onApprove(selected)}
        />
      }
    >
      <div className="wms-voucher-detail-table-wrap">
        <table className="wms-voucher-detail-table">
          <thead>
            <tr>
              <th className="table-header-cell text-left">Vật tư</th>
              <th className="table-header-cell text-right">SL</th>
              <th className="table-header-cell text-center">ĐVT</th>
            </tr>
          </thead>
          <tbody>
            {selected.items.map((it, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell">
                  <span className="font-medium text-[var(--md-on-surface)]">{it.name}</span>
                  <span className="block text-[11px] text-[var(--md-on-surface-variant)] font-mono mt-0.5">
                    {it.sku || it.productId}
                  </span>
                </td>
                <td className="table-cell text-right tabular-nums">{it.qty}</td>
                <td className="table-cell text-center">{it.unit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VoucherDetailModal>
  );
}
