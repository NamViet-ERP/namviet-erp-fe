import type { Import } from '../../../types';
import { formatCurrency } from '../../../utils/formatCurrency';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import VoucherDetailFooter from '../../../components/warehouse/VoucherDetailFooter';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import { importStatusHint } from './importUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';

interface ImportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Import | null;
  projectName: (code?: string) => string;
  isSubmitPending: boolean;
  isApprovePending: boolean;
  onSubmit: (imp: Import) => void;
  onApprove: (imp: Import) => void;
}

export default function ImportDetailModal({
  isOpen,
  onClose,
  selected,
  projectName,
  isSubmitPending,
  isApprovePending,
  onSubmit,
  onApprove,
}: ImportDetailModalProps) {
  if (!selected) return null;

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      statusHint={importStatusHint(selected.status)}
      approvedBy={selected.approvedBy}
      approvedAt={selected.approvedAt}
      fields={[
        {
          label: 'Kho dự án',
          value: selected.project ? projectName(selected.project) : displayValue(),
        },
        { label: 'Nhà cung cấp', value: displayValue(selected.supplier) },
        { label: 'Mã tham chiếu', value: displayValue(selected.referenceCode) },
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
              <th className="table-header-cell text-right">Đơn giá</th>
              <th className="table-header-cell text-right">Thành tiền</th>
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
                <td className="table-cell text-right tabular-nums">{formatCurrency(it.unitPrice)}</td>
                <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-primary)]">
                  {formatCurrency(it.qty * it.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="table-cell text-right font-semibold">
                Tổng cộng
              </td>
              <td className="table-cell text-right font-bold tabular-nums text-[var(--md-primary)]">
                {formatCurrency(selected.totalValue)} đ
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </VoucherDetailModal>
  );
}
