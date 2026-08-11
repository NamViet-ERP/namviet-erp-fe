import type { Import } from '../../../types';
import { FileText, Pencil } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import { displayValue } from '../../../components/warehouse/voucherDetailUtils';
import FormField from '../../../components/ui/FormField';
import {
  SavedImportDocList,
  SavedImportPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';
import { importStatusHint } from './importUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';
import { printVoucherWithFeedback } from '../../../lib/wms/printVoucher';
import { buildImportPrintPayload } from '../../../lib/wms/voucherPrintBuilders';

interface ImportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Import | null;
  projectName: (code?: string) => string;
  onEdit?: (imp: Import) => void;
  /** Thủ kho duyệt nhanh từ chi tiết (phiếu pending) — nên mở Sửa để chỉnh SL trước. */
  onApprove?: (imp: Import) => void;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
  /** Ẩn đơn giá / thành tiền / tổng khi không có wms.prices.view */
  showPrices?: boolean;
  isApproving?: boolean;
}

export default function ImportDetailModal({
  isOpen,
  onClose,
  selected,
  projectName,
  onEdit,
  onApprove,
  onDownloadAttachment,
  showPrices = true,
  isApproving = false,
}: ImportDetailModalProps) {
  if (!selected) return null;

  const canEdit = Boolean(onEdit) && (selected.status === 'draft' || selected.status === 'pending');
  const canApproveHere = Boolean(onApprove) && selected.status === 'pending';
  const attachments = selected.attachments ?? [];
  const evaluation = (selected.receiptEvaluation ?? '').trim();

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind="import"
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
        { label: 'KHMH', value: displayValue(selected.planCode) },
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
            onClick={() =>
              printVoucherWithFeedback(
                buildImportPrintPayload(
                  selected,
                  selected.project ? projectName(selected.project) : '—',
                  { showPrices },
                ),
              )
            }
          >
            <FileText size={14} /> In phiếu
          </button>
          {canEdit ? (
            <button type="button" className="btn btn-filled" onClick={() => onEdit?.(selected)}>
              <Pencil size={14} /> Sửa phiếu
              {selected.status === 'pending' ? ' (chỉnh SL thực nhận)' : ''}
            </button>
          ) : null}
          {canApproveHere ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isApproving}
              onClick={() => onApprove?.(selected)}
            >
              Duyệt thực tế
            </button>
          ) : null}
        </div>
      }
    >
      {selected.status === 'pending' ? (
        <p className="text-xs text-[var(--md-on-surface-variant)] mb-3 text-pretty rounded-lg border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2">
          Thủ kho: mở <strong>Sửa phiếu</strong> để chỉnh <strong>SL thực nhận</strong> nếu khác dự kiến,
          rồi bấm <strong>Lưu SL thực nhận &amp; Duyệt</strong>.
          Phần còn thiếu trên PO có thể nhập lần sau; hàng lỗi/thiếu nghiêm trọng → tạo phiếu ở
          {' '}<strong>Hàng lỗi và Bảo hành</strong>.
        </p>
      ) : null}
      <div className="wms-voucher-detail-table-wrap">
        <table className="wms-voucher-detail-table">
          <thead>
            <tr>
              <th className="table-header-cell text-left">Tên vật tư</th>
              <th className="table-header-cell text-right">SL</th>
              <th className="table-header-cell text-center">ĐVT</th>
              {showPrices ? (
                <>
                  <th className="table-header-cell text-right">Đơn giá</th>
                  <th className="table-header-cell text-right">Thành tiền</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {selected.items.map((it, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell">
                  <span className="font-medium text-[var(--md-on-surface)]">{it.name}</span>
                </td>
                <td className="table-cell text-right tabular-nums">{it.qty}</td>
                <td className="table-cell text-center">{it.unit || '—'}</td>
                {showPrices ? (
                  <>
                    <td className="table-cell text-right tabular-nums">{formatCurrency(it.unitPrice)}</td>
                    <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-primary)]">
                      {formatCurrency(it.qty * it.unitPrice)}
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
          {showPrices ? (
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
          ) : null}
        </table>
      </div>

      <div className="mt-4 space-y-3">
        <FormField label="Đánh giá nhận hàng">
          <div className="form-input pending-evidence-note min-h-[4.5rem] whitespace-pre-wrap text-pretty bg-[var(--md-surface-container-low)]">
            {evaluation || '—'}
          </div>
        </FormField>
        {selected.status === 'approved' ? (
          <p className="text-[11px] text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
            Phiếu đã duyệt — chỉ xem chứng từ và ảnh.
          </p>
        ) : canEdit ? (
          <p className="text-[11px] text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
            Chỉ xem. Chỉnh đánh giá / ảnh / file trong Sửa phiếu.
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Ảnh nhận hàng">
            <div className="pending-evidence">
              <SavedImportPhotoGrid
                importId={selected.id}
                attachments={attachments}
                canEdit={false}
                onDownload={(attachmentId, fileName) => {
                  if (!onDownloadAttachment) return;
                  void onDownloadAttachment(selected, attachmentId, fileName);
                }}
              />
            </div>
          </FormField>

          <FormField label="File chứng từ">
            <div className="pending-evidence">
              <SavedImportDocList
                attachments={attachments}
                canEdit={false}
                onDownload={(attachmentId, fileName) => {
                  if (!onDownloadAttachment) return;
                  void onDownloadAttachment(selected, attachmentId, fileName);
                }}
              />
            </div>
          </FormField>
        </div>
      </div>
    </VoucherDetailModal>
  );
}
