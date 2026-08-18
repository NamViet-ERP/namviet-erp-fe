import { useEffect, useRef, useState } from 'react';
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
import ImportCreateEvidenceSection from './ImportCreateEvidenceSection';

interface ImportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: Import | null;
  projectName: (code?: string) => string;
  /** Chỉ dùng cho phiếu nháp: mở form sửa header / dòng hàng. */
  onEdit?: (imp: Import) => void;
  /** Thủ kho duyệt thực tế từ chi tiết (phiếu pending) sau khi đủ 3 mục chứng từ. */
  onApprove?: (imp: Import, evaluation?: string) => void;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
  /** Thủ kho được cập nhật đánh giá / ảnh / file trên phiếu pending. */
  canUpdateEvidence?: boolean;
  isEvidencePending?: boolean;
  onUploadAttachment?: (imp: Import, file: File, kind: 'document' | 'photo') => Promise<void>;
  onDeleteAttachment?: (imp: Import, attachmentId: string) => Promise<void>;
  onSaveEvaluation?: (imp: Import, evaluation: string) => Promise<void>;
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
  canUpdateEvidence = false,
  isEvidencePending = false,
  onUploadAttachment,
  onDeleteAttachment,
  onSaveEvaluation,
  showPrices = true,
  isApproving = false,
}: ImportDetailModalProps) {
  const [evaluationDraft, setEvaluationDraft] = useState('');
  const [showEvidenceErrors, setShowEvidenceErrors] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowEvidenceErrors(false);
      return;
    }
    setEvaluationDraft(selected?.receiptEvaluation ?? '');
    setShowEvidenceErrors(false);
  }, [isOpen, selected?.id, selected?.receiptEvaluation]);

  if (!selected) return null;

  const canEditDraft = Boolean(onEdit) && selected.status === 'draft';
  const canReceiveHere = Boolean(onApprove) && selected.status === 'pending';
  const evidenceEditable = canUpdateEvidence && selected.status === 'pending';
  const attachments = selected.attachments ?? [];
  const evaluation = (selected.receiptEvaluation ?? '').trim();
  const hasPhoto = attachments.some(a => a.kind === 'photo');
  const hasDocument = attachments.some(a => a.kind === 'document');
  const evidenceErrors = showEvidenceErrors
    ? {
        evaluation: !evaluationDraft.trim() ? 'Vui lòng nhập đánh giá nhận hàng' : undefined,
        photo: !hasPhoto ? 'Vui lòng chọn ít nhất 1 ảnh nhận hàng' : undefined,
        document: !hasDocument ? 'Vui lòng chọn ít nhất 1 file chứng từ' : undefined,
      }
    : undefined;

  const handleApproveClick = () => {
    if (!evaluationDraft.trim() || !hasPhoto || !hasDocument) {
      setShowEvidenceErrors(true);
      return;
    }
    onApprove?.(selected, evaluationDraft);
  };

  const persistEvaluation = () => {
    if (!onSaveEvaluation) return;
    const next = evaluationDraft.trim();
    if (next === (selected.receiptEvaluation ?? '').trim()) return;
    void onSaveEvaluation(selected, evaluationDraft);
  };

  const statusHint = evidenceEditable
    ? 'Nhập dự kiến - cập nhật đánh giá, ảnh và chứng từ rồi duyệt thực tế'
    : importStatusHint(selected.status);

  return (
    <VoucherDetailModal
      isOpen={isOpen}
      onClose={onClose}
      voucherCode={selected.voucherCode}
      status={selected.status}
      voucherKind="import"
      statusHint={statusHint}
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
      itemsTitle={`Danh sách vật tư (${selected.items.length})`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              printVoucherWithFeedback(
                buildImportPrintPayload(
                  selected,
                  selected.project ? projectName(selected.project) : '-',
                  { showPrices },
                ),
              )
            }
          >
            <FileText size={14} /> In phiếu
          </button>
          {canEditDraft ? (
            <button type="button" className="btn btn-filled" onClick={() => onEdit?.(selected)}>
              <Pencil size={14} /> Sửa phiếu
            </button>
          ) : null}
          {canReceiveHere ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isApproving || isEvidencePending}
              onClick={handleApproveClick}
            >
              Duyệt thực tế
            </button>
          ) : null}
        </div>
      }
    >
      <div className="wms-voucher-detail-table-wrap">
        <table className="wms-voucher-detail-table wms-voucher-detail-table--fixed">
          <thead>
            <tr>
              <th className="table-header-cell wms-voucher-detail-col-stt">STT</th>
              <th className="table-header-cell wms-voucher-detail-col-code text-left">Mã VT</th>
              <th className="table-header-cell text-left">Tên vật tư</th>
              <th className="table-header-cell wms-voucher-detail-col-qty text-right">SL</th>
              <th className="table-header-cell wms-voucher-detail-col-unit">ĐVT</th>
              {showPrices ? (
                <>
                  <th className="table-header-cell wms-voucher-detail-col-money text-right">Đơn giá</th>
                  <th className="table-header-cell wms-voucher-detail-col-money text-right">Thành tiền</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {selected.items.map((it, i) => {
              const code = (it.sku || it.productId || '').trim();
              return (
                <tr key={`${code}-${i}`} className="table-row">
                  <td className="table-cell wms-voucher-detail-col-stt text-center tabular-nums text-[var(--md-on-surface-variant)]">
                    {i + 1}
                  </td>
                  <td className="table-cell wms-voucher-detail-col-code font-mono text-[var(--md-on-surface)]" title={code || undefined}>
                    {code || '-'}
                  </td>
                  <td className="table-cell font-semibold text-[var(--md-on-surface)]">
                    {it.name}
                  </td>
                  <td className="table-cell wms-voucher-detail-col-qty text-right tabular-nums">
                    {it.qty}
                  </td>
                  <td className="table-cell wms-voucher-detail-col-unit text-center">
                    {it.unit?.trim() || '-'}
                  </td>
                  {showPrices ? (
                    <>
                      <td className="table-cell wms-voucher-detail-col-money table-cell--money">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="table-cell wms-voucher-detail-col-money table-cell--money font-semibold text-[var(--md-primary)]">
                        {formatCurrency(it.qty * it.unitPrice)}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={3}
                className="table-cell text-[var(--md-on-surface-variant)]"
              >
                {selected.items.length} dòng
              </td>
              <td className="table-cell wms-voucher-detail-col-qty text-right tabular-nums font-semibold">
                {selected.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)}
              </td>
              <td className="table-cell wms-voucher-detail-col-unit" />
              {showPrices ? (
                <>
                  <td className="table-cell wms-voucher-detail-col-money" />
                  <td className="table-cell wms-voucher-detail-col-money table-cell--money font-semibold text-[var(--md-primary)]">
                    {formatCurrency(selected.totalValue)}
                  </td>
                </>
              ) : null}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 space-y-3">
        {evidenceEditable ? (
          <ImportCreateEvidenceSection
            isCreateMode={false}
            markRequired
            evidenceErrors={evidenceErrors}
            evaluationDraft={evaluationDraft}
            onEvaluationChange={value => {
              setEvaluationDraft(value);
              if (showEvidenceErrors) setShowEvidenceErrors(false);
            }}
            onEvaluationBlur={persistEvaluation}
            evidencePhotos={[]}
            evidenceDocs={[]}
            onEvidencePhotosChange={() => {}}
            onEvidenceDocsChange={() => {}}
            evidenceInputRef={evidenceInputRef}
            evidenceDocInputRef={evidenceDocInputRef}
            editVoucherCode={selected.id}
            editAttachments={attachments}
            isEvidencePending={isEvidencePending}
            hint="Cập nhật đánh giá, ảnh nhận hàng và file chứng từ. Đủ 3 mục mới duyệt thực tế."
            onUploadEditAttachment={
              onUploadAttachment
                ? (file, kind) => onUploadAttachment(selected, file, kind)
                : undefined
            }
            onDeleteEditAttachment={
              onDeleteAttachment
                ? attachmentId => onDeleteAttachment(selected, attachmentId)
                : undefined
            }
            onDownloadEditAttachment={
              onDownloadAttachment
                ? (attachmentId, fileName) => onDownloadAttachment(selected, attachmentId, fileName)
                : undefined
            }
          />
        ) : (
          <>
            <FormField label="Đánh giá nhận hàng">
              <div className="form-input pending-evidence-note min-h-[4.5rem] whitespace-pre-wrap text-pretty bg-[var(--md-surface-container-low)]">
                {evaluation || '-'}
              </div>
            </FormField>
            {selected.status === 'approved' ? (
              <p className="text-xs text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
                Phiếu đã duyệt - chỉ xem chứng từ và ảnh.
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
          </>
        )}
      </div>
    </VoucherDetailModal>
  );
}
