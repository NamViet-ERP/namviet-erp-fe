import { useEffect, useRef, useState } from 'react';
import type { Import } from '../../../types';
import { FileText, Upload } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import VoucherDetailModal from '../../../components/warehouse/VoucherDetailModal';
import VoucherDetailFooter from '../../../components/warehouse/VoucherDetailFooter';
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
  isSubmitPending: boolean;
  isApprovePending: boolean;
  isEvidencePending?: boolean;
  onSubmit?: (imp: Import) => void;
  onApprove?: (imp: Import, evaluation: string) => void | Promise<void>;
  onSaveEvaluation?: (imp: Import, evaluation: string) => Promise<void>;
  onUploadAttachment?: (imp: Import, file: File, kind: 'document' | 'photo') => Promise<void>;
  onDeleteAttachment?: (imp: Import, attachmentId: string) => Promise<void>;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
}

export default function ImportDetailModal({
  isOpen,
  onClose,
  selected,
  projectName,
  isSubmitPending,
  isApprovePending,
  isEvidencePending = false,
  onSubmit,
  onApprove,
  onSaveEvaluation,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: ImportDetailModalProps) {
  const [evaluation, setEvaluation] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const evaluationRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selected) return;
    setEvaluation(selected.receiptEvaluation ?? '');
    setShowErrors(false);
  }, [selected]);

  if (!selected) return null;
  const canEditEvidence = selected.status !== 'approved';
  const attachments = selected.attachments ?? [];
  const hasPhoto = attachments.some(a => a.kind === 'photo');
  const hasDocument = attachments.some(a => a.kind === 'document');

  const evaluationError =
    showErrors && !evaluation.trim() ? 'Vui lòng nhập đánh giá nhận hàng' : undefined;
  const photoError =
    showErrors && !hasPhoto ? 'Vui lòng chọn ít nhất 1 ảnh nhận hàng' : undefined;
  const documentError =
    showErrors && !hasDocument ? 'Vui lòng chọn ít nhất 1 file chứng từ' : undefined;

  const uploadFiles = async (files: File[], kind: 'document' | 'photo') => {
    if (!onUploadAttachment || files.length === 0) return;
    for (const file of files) {
      await onUploadAttachment(selected, file, kind);
    }
  };

  const tryApprove = () => {
    if (!onApprove) return;
    const evalOk = evaluation.trim().length > 0;
    const photoOk = hasPhoto;
    const documentOk = hasDocument;
    if (!evalOk || !photoOk || !documentOk) {
      setShowErrors(true);
      if (!evalOk) {
        requestAnimationFrame(() => evaluationRef.current?.focus());
      }
      return;
    }
    void onApprove(selected, evaluation);
  };

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
                ),
              )
            }
          >
            <FileText size={14} /> In phiếu
          </button>
          <div className="flex items-center gap-2">
            <VoucherDetailFooter
              status={selected.status}
              isSubmitPending={isSubmitPending}
              isApprovePending={isApprovePending}
              onSubmit={onSubmit ? () => onSubmit(selected) : undefined}
              onApprove={onApprove ? tryApprove : undefined}
            />
          </div>
        </div>
      }
    >
      <div className="wms-voucher-detail-table-wrap">
        <table className="wms-voucher-detail-table">
          <thead>
            <tr>
              <th className="table-header-cell text-left">Tên vật tư</th>
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

      <div className="mt-4 space-y-1">
        <FormField label="Đánh giá nhận hàng" required error={evaluationError}>
          <textarea
            ref={evaluationRef}
            className="form-input pending-evidence-note"
            rows={3}
            value={evaluation}
            disabled={!canEditEvidence || isEvidencePending}
            onChange={e => setEvaluation(e.target.value)}
            placeholder="Mô tả tình trạng hàng khi nhận…"
            aria-label="Đánh giá nhận hàng"
            aria-invalid={Boolean(evaluationError)}
          />
        </FormField>
        {canEditEvidence ? (
          <div className="flex items-center justify-end gap-2 flex-wrap -mt-1 mb-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={isEvidencePending}
              onClick={() => onSaveEvaluation && void onSaveEvaluation(selected, evaluation)}
            >
              Lưu đánh giá
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--md-on-surface-variant)] -mt-1 mb-2">
            Phiếu đã duyệt — chỉ xem chứng từ và ảnh.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Ảnh nhận hàng" required error={photoError}>
            <div className={`pending-evidence${photoError ? ' pending-evidence--error' : ''}`}>
              {canEditEvidence ? (
                <>
                  <button
                    type="button"
                    className={`pending-evidence__zone${isEvidencePending ? ' is-disabled' : ''}`}
                    disabled={isEvidencePending}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload size={20} aria-hidden />
                    <span className="pending-evidence__zone-hint">
                      {isEvidencePending ? 'Đang tải…' : 'Chọn ảnh (có thể chọn nhiều)'}
                    </span>
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="pending-evidence__input"
                    disabled={isEvidencePending}
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = '';
                      if (files.length) void uploadFiles(files, 'photo');
                    }}
                  />
                </>
              ) : null}
              <SavedImportPhotoGrid
                importId={selected.id}
                attachments={attachments}
                canEdit={canEditEvidence && !isEvidencePending}
                onDelete={attachmentId => {
                  if (!onDeleteAttachment) return;
                  void onDeleteAttachment(selected, attachmentId);
                }}
                onDownload={(attachmentId, fileName) => {
                  if (!onDownloadAttachment) return;
                  void onDownloadAttachment(selected, attachmentId, fileName);
                }}
              />
            </div>
          </FormField>

          <FormField label="File chứng từ" required error={documentError}>
            <div className={`pending-evidence${documentError ? ' pending-evidence--error' : ''}`}>
              {canEditEvidence ? (
                <>
                  <button
                    type="button"
                    className={`pending-evidence__zone${isEvidencePending ? ' is-disabled' : ''}`}
                    disabled={isEvidencePending}
                    onClick={() => docInputRef.current?.click()}
                  >
                    <FileText size={20} aria-hidden />
                    <span className="pending-evidence__zone-hint">
                      {isEvidencePending ? 'Đang tải…' : 'Chọn file PDF / Word / Excel'}
                    </span>
                  </button>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                    multiple
                    className="pending-evidence__input"
                    disabled={isEvidencePending}
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = '';
                      if (files.length) void uploadFiles(files, 'document');
                    }}
                  />
                </>
              ) : null}
              <SavedImportDocList
                attachments={attachments}
                canEdit={canEditEvidence && !isEvidencePending}
                onDelete={attachmentId => {
                  if (!onDeleteAttachment) return;
                  void onDeleteAttachment(selected, attachmentId);
                }}
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
