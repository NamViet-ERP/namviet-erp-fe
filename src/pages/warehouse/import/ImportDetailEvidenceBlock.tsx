import { useRef } from 'react';
import type { Import } from '../../../types';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import {
  SavedImportDocList,
  SavedImportPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';
import ImportCreateEvidenceSection, {
  type ImportEvidenceFieldErrors,
} from './ImportCreateEvidenceSection';

export interface ImportDetailEvidenceBlockProps {
  selected: Import;
  totals: { accepted: number; defect: number; shortage: number };
  settlementEditable: boolean;
  evidenceEditable: boolean;
  isEvidencePending: boolean;
  evaluationDraft: string;
  onEvaluationChange: (value: string) => void;
  onEvaluationBlur: () => void;
  evidenceErrors?: ImportEvidenceFieldErrors;
  defectReason: string;
  onDefectReasonChange: (value: string) => void;
  shortageReport: string;
  onShortageReportChange: (value: string) => void;
  settlementError: string | null;
  onUploadAttachment?: (
    imp: Import,
    file: File,
    kind: 'document' | 'photo' | 'defect_photo',
  ) => Promise<void>;
  onDeleteAttachment?: (imp: Import, attachmentId: string) => Promise<void>;
  onDownloadAttachment?: (imp: Import, attachmentId: string, fileName: string) => Promise<void>;
}

export default function ImportDetailEvidenceBlock({
  selected,
  totals,
  settlementEditable,
  evidenceEditable,
  isEvidencePending,
  evaluationDraft,
  onEvaluationChange,
  onEvaluationBlur,
  evidenceErrors,
  defectReason,
  onDefectReasonChange,
  shortageReport,
  onShortageReportChange,
  settlementError,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: ImportDetailEvidenceBlockProps) {
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceDocInputRef = useRef<HTMLInputElement>(null);
  const defectPhotoInputRef = useRef<HTMLInputElement>(null);
  const attachments = selected.attachments ?? [];
  const defectPhotos = attachments.filter(a => a.kind === 'defect_photo');
  const evaluation = (selected.receiptEvaluation ?? '').trim();

  return (
    <>
      {settlementEditable && totals.defect > 0 ? (
        <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3">
          <p className="text-[length:var(--fs-sm)] font-semibold text-[var(--md-on-surface)]">Hàng lỗi - ảnh</p>
          <FormField label="Lý do chung phiếu HL (tuỳ chọn)">
            <input
              className="form-input"
              value={defectReason}
              onChange={e => onDefectReasonChange(e.target.value)}
              placeholder="Ghi chú chung cho phiếu HL"
            />
          </FormField>
          <div>
            <p className="mb-1 text-[length:var(--fs-xs)] font-medium text-[var(--md-on-surface-variant)]">
              Ảnh hàng lỗi <span className="text-[var(--md-error)]">*</span>
            </p>
            <input
              ref={defectPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                files.forEach(file => {
                  void onUploadAttachment?.(selected, file, 'defect_photo');
                });
              }}
            />
            <Button
              type="button"
              variant="outlined"
              disabled={isEvidencePending || !onUploadAttachment}
              onClick={() => defectPhotoInputRef.current?.click()}
            >
              Chọn ảnh hàng lỗi
            </Button>
            {defectPhotos.length > 0 ? (
              <div className="mt-2">
                <SavedImportPhotoGrid
                  importId={selected.id}
                  attachments={defectPhotos}
                  kinds={['defect_photo']}
                  canEdit={Boolean(onDeleteAttachment)}
                  onDelete={id => {
                    void onDeleteAttachment?.(selected, id);
                  }}
                  onDownload={
                    onDownloadAttachment
                      ? (id, name) => {
                          void onDownloadAttachment(selected, id, name);
                        }
                      : undefined
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {settlementEditable && totals.shortage > 0 ? (
        <div className="mt-3">
          <FormField label="Báo cáo thiếu hàng" required>
            <textarea
              className="form-input min-h-[4.5rem]"
              value={shortageReport}
              onChange={e => onShortageReportChange(e.target.value)}
              placeholder="NCC giao thiếu bao nhiêu, lý do, hạn giao bù..."
            />
          </FormField>
          <p className="mt-1 text-[length:var(--fs-micro)] text-[var(--md-on-surface-variant)]">
            Cung ứng dùng báo cáo này để tạo phiếu nhập lần sau từ PO.
          </p>
        </div>
      ) : null}

      {!settlementEditable && selected.shortageReport ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--md-outline)] bg-[var(--md-surface-container-low)] p-3">
          <p className="text-[length:var(--fs-xs)] font-medium text-[var(--md-on-surface-variant)]">Báo cáo thiếu hàng</p>
          <p className="mt-1 whitespace-pre-wrap text-[length:var(--fs-sm)] text-[var(--md-on-surface)]">
            {selected.shortageReport}
          </p>
        </div>
      ) : null}

      {settlementError ? (
        <p
          data-settlement-error
          className="mt-2 text-[length:var(--fs-sm)] text-[var(--md-error)] font-semibold"
          role="alert"
        >
          {settlementError}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {evidenceEditable ? (
          <ImportCreateEvidenceSection
            isCreateMode={false}
            markRequired
            evidenceErrors={evidenceErrors}
            evaluationDraft={evaluationDraft}
            onEvaluationChange={onEvaluationChange}
            onEvaluationBlur={onEvaluationBlur}
            evidencePhotos={[]}
            evidenceDocs={[]}
            onEvidencePhotosChange={() => {}}
            onEvidenceDocsChange={() => {}}
            evidenceInputRef={evidenceInputRef}
            evidenceDocInputRef={evidenceDocInputRef}
            editVoucherCode={selected.id}
            editAttachments={attachments.filter(a => a.kind === 'photo' || a.kind === 'document')}
            isEvidencePending={isEvidencePending}
            hint="Cần đánh giá, ảnh nhận hàng và file chứng từ trước khi duyệt."
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
    </>
  );
}
