import type { ExportReturn } from '../../../types';
import { FileText } from 'lucide-react';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import VoucherDetailFooter from '../../../components/warehouse/VoucherDetailFooter';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';
import { fmtStockQty } from '../../../lib/wms/stockQtyFormat';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import { buildExportReturnPrintPayload } from '../../../lib/wms/voucherPrintBuilders';

interface ExportReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: ExportReturn | null;
  isSubmitPending: boolean;
  isApprovePending: boolean;
  onSubmit: (row: ExportReturn) => void;
  onApprove: (row: ExportReturn) => void;
}

function statusHint(status: ExportReturn['status']) {
  if (status === 'draft') return 'Nháp — chưa ghi dự kiến hoàn trả';
  if (status === 'pending') return 'Chờ duyệt — vật tư sẽ về kho dự án khi thủ kho duyệt';
  if (status === 'approved') return 'Đã duyệt — vật tư đã hoàn về kho dự án';
  return '';
}

export default function ExportReturnDetailModal({
  isOpen,
  onClose,
  selected,
  isSubmitPending,
  isApprovePending,
  onSubmit,
  onApprove,
}: ExportReturnDetailModalProps) {
  if (!selected) return null;

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind="exportReturn"
      statusHint={statusHint(selected.status)}
      approvedBy={selected.approvedBy}
      approvedAt={selected.approvedAt}
      fields={[
        { label: 'Phiếu xuất nguồn', value: displayValue(selected.sourceExportCode) },
        { label: 'Kho dự án', value: displayValue(selected.projectName || selected.project) },
        { label: 'Người lập', value: displayValue(selected.createdBy) },
        {
          label: 'Ngày lập',
          value: displayValue(formatDateTimeVi(getVoucherCreatedAt(selected)?.toISOString())),
        },
        { label: 'Ghi chú', value: displayValue(selected.note), wide: true },
      ]}
      itemsTitle="Vật tư hoàn trả"
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => printVoucherWithFeedback(buildExportReturnPrintPayload(
              selected,
              selected.projectName || selected.project || '—',
            ))}
          >
            <FileText size={14} /> In phiếu
          </button>
          <div className="flex items-center gap-2">
            <VoucherDetailFooter
              status={selected.status}
              onSubmit={() => onSubmit(selected)}
              onApprove={() => onApprove(selected)}
              isSubmitPending={isSubmitPending}
              isApprovePending={isApprovePending}
            />
          </div>
        </div>
      }
    >
      <div className="wms-voucher-detail-table-wrap">
        <table className="wms-voucher-detail-table">
          <thead>
            <tr>
              <th className="table-header-cell text-left">Vật tư</th>
              <th className="table-header-cell text-right">SL hoàn trả</th>
              <th className="table-header-cell text-center">ĐVT</th>
            </tr>
          </thead>
          <tbody>
            {selected.items.map((item, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell">
                  <span className="font-medium text-[var(--md-on-surface)]">{item.name}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-[var(--md-on-surface-variant)]">
                    {item.sku || item.productId}
                  </span>
                </td>
                <td className="table-cell text-right tabular-nums">{fmtStockQty(item.qty)}</td>
                <td className="table-cell text-center">{item.unit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VoucherDetailModal>
  );
}
