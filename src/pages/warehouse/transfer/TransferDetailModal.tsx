import type { Transfer } from '../../../types';
import { FileText } from 'lucide-react';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import VoucherDetailFooter from '../../../components/warehouse/VoucherDetailFooter';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import {
  destinationLabel,
  isCrossProjectTransfer,
  transferProjectLabel,
  transferStatusHint,
} from './transferUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import { buildTransferPrintPayload } from '../../../lib/wms/voucherPrintBuilders';

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Transfer | null;
  isSubmitPending: boolean;
  isApprovePending: boolean;
  onSubmit: (tf: Transfer) => void;
  onApprove: (tf: Transfer) => void;
}

export default function TransferDetailModal({
  isOpen,
  onClose,
  selected,
  isSubmitPending,
  isApprovePending,
  onSubmit,
  onApprove,
}: TransferDetailModalProps) {
  if (!selected) return null;

  const crossProject = isCrossProjectTransfer(selected);

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind="transfer"
      statusHint={transferStatusHint(selected.status, crossProject)}
      approvedBy={selected.approvedBy}
      approvedAt={selected.approvedAt}
      fields={[
        { label: 'Từ kho dự án', value: transferProjectLabel(selected) },
        { label: 'Đích', value: destinationLabel(selected) },
        {
          label: 'Tạo lúc',
          value: displayValue(formatDateTimeVi(getVoucherCreatedAt(selected)?.toISOString())),
        },
        { label: 'Người lập', value: displayValue(selected.createdBy) },
        { label: 'Ghi chú', value: displayValue(selected.note), wide: true },
      ]}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => printVoucherWithFeedback(buildTransferPrintPayload(selected))}
          >
            <FileText size={14} /> In phiếu
          </button>
          <div className="flex items-center gap-2">
            <VoucherDetailFooter
              status={selected.status}
              isSubmitPending={isSubmitPending}
              isApprovePending={isApprovePending}
              onSubmit={() => onSubmit(selected)}
              onApprove={() => onApprove(selected)}
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
              <th className="table-header-cell text-right">SL</th>
              <th className="table-header-cell text-center">ĐVT</th>
              <th className="table-header-cell text-left">Công đoạn</th>
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
                <td className="table-cell">{String(it.constructionPhase ?? '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VoucherDetailModal>
  );
}
