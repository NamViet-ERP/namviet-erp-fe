import { FileText, Upload } from 'lucide-react';
import type { ImportAttachment } from '../../../types';
import FormField from '../../../components/ui/FormField';
import {
  PendingDocList,
  PendingPhotoGrid,
  SavedImportDocList,
  SavedImportPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';

export interface ImportEvidenceFieldErrors {
  evaluation?: string;
  photo?: string;
  document?: string;
}

export interface ImportCreateEvidenceSectionProps {
  isCreateMode: boolean;
  /** Hiện dấu * — bắt buộc trước khi duyệt thực tế. */
  markRequired?: boolean;
  evidenceErrors?: ImportEvidenceFieldErrors;
  evaluationDraft: string;
  onEvaluationChange: (value: string) => void;
  onEvaluationBlur?: () => void;
  /** Ghi đè dòng hướng dẫn dưới ô đánh giá. */
  hint?: string;
  evidencePhotos: File[];
  evidenceDocs: File[];
  onEvidencePhotosChange: (updater: (prev: File[]) => File[]) => void;
  onEvidenceDocsChange: (updater: (prev: File[]) => File[]) => void;
  evidenceInputRef: React.RefObject<HTMLInputElement | null>;
  evidenceDocInputRef: React.RefObject<HTMLInputElement | null>;
  editVoucherCode?: string;
  editAttachments: ImportAttachment[];
  isEvidencePending: boolean;
  onUploadEditAttachment?: (file: File, kind: 'document' | 'photo') => Promise<void>;
  onDeleteEditAttachment?: (attachmentId: string) => Promise<void>;
  onDownloadEditAttachment?: (attachmentId: string, fileName: string) => Promise<void>;
}

export default function ImportCreateEvidenceSection({
  isCreateMode,
  markRequired = false,
  evidenceErrors,
  evaluationDraft,
  onEvaluationChange,
  onEvaluationBlur,
  hint,
  evidencePhotos,
  evidenceDocs,
  onEvidencePhotosChange,
  onEvidenceDocsChange,
  evidenceInputRef,
  evidenceDocInputRef,
  editVoucherCode,
  editAttachments,
  isEvidencePending,
  onUploadEditAttachment,
  onDeleteEditAttachment,
  onDownloadEditAttachment,
}: ImportCreateEvidenceSectionProps) {
  const evaluationError = evidenceErrors?.evaluation;
  const photoError = evidenceErrors?.photo;
  const documentError = evidenceErrors?.document;

  if (isCreateMode) {
    return (
      <div className="space-y-3">
        <FormField label="Đánh giá nhận hàng" required={markRequired} error={evaluationError}>
          <textarea
            className="form-input pending-evidence-note"
            rows={3}
            value={evaluationDraft}
            onChange={e => onEvaluationChange(e.target.value)}
            onBlur={onEvaluationBlur}
            placeholder="Mô tả tình trạng hàng khi nhận…"
            aria-invalid={Boolean(evaluationError)}
          />
        </FormField>
        <p className="text-xs text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
          {hint ?? 'Có thể đính kèm ngay khi tạo. Duyệt thực tế bắt buộc có đánh giá + ảnh + file chứng từ.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Ảnh nhận hàng" required={markRequired} error={photoError}>
            <div className={`pending-evidence${photoError ? ' pending-evidence--error' : ''}`}>
              <button
                type="button"
                className="pending-evidence__zone"
                onClick={() => evidenceInputRef.current?.click()}
              >
                <Upload size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">Chọn ảnh (có thể chọn nhiều)</span>
              </button>
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*"
                multiple
                className="pending-evidence__input"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) onEvidencePhotosChange(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              <PendingPhotoGrid
                files={evidencePhotos}
                onRemove={idx => onEvidencePhotosChange(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>
          </FormField>
          <FormField label="File chứng từ" required={markRequired} error={documentError}>
            <div className={`pending-evidence${documentError ? ' pending-evidence--error' : ''}`}>
              <button
                type="button"
                className="pending-evidence__zone"
                onClick={() => evidenceDocInputRef.current?.click()}
              >
                <FileText size={20} aria-hidden />
                <span className="pending-evidence__zone-hint">Chọn file PDF / Word / Excel</span>
              </button>
              <input
                ref={evidenceDocInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
                multiple
                className="pending-evidence__input"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) onEvidenceDocsChange(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              <PendingDocList
                files={evidenceDocs}
                onRemove={idx => onEvidenceDocsChange(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>
          </FormField>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormField label="Đánh giá nhận hàng" required={markRequired} error={evaluationError}>
        <textarea
          className="form-input pending-evidence-note"
          rows={3}
          value={evaluationDraft}
          onChange={e => onEvaluationChange(e.target.value)}
          onBlur={onEvaluationBlur}
          placeholder="Mô tả tình trạng hàng khi nhận…"
          disabled={isEvidencePending}
          aria-invalid={Boolean(evaluationError)}
        />
      </FormField>
      <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty">
        {hint ?? 'Thêm / xóa ảnh và file chứng từ. Cần đủ đánh giá, ảnh và file trước khi duyệt thực tế.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Ảnh nhận hàng" required={markRequired} error={photoError}>
          <div className={`pending-evidence${photoError ? ' pending-evidence--error' : ''}`}>
            <button
              type="button"
              className={`pending-evidence__zone${isEvidencePending ? ' is-disabled' : ''}`}
              disabled={isEvidencePending || !onUploadEditAttachment}
              onClick={() => evidenceInputRef.current?.click()}
            >
              <Upload size={20} aria-hidden />
              <span className="pending-evidence__zone-hint">
                {isEvidencePending ? 'Đang tải…' : 'Chọn ảnh (có thể chọn nhiều)'}
              </span>
            </button>
            <input
              ref={evidenceInputRef}
              type="file"
              accept="image/*"
              multiple
              className="pending-evidence__input"
              disabled={isEvidencePending || !onUploadEditAttachment}
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (!onUploadEditAttachment || files.length === 0) return;
                void (async () => {
                  for (const file of files) await onUploadEditAttachment(file, 'photo');
                })();
              }}
            />
            <SavedImportPhotoGrid
              importId={editVoucherCode ?? 'edit'}
              attachments={editAttachments}
              canEdit={Boolean(onDeleteEditAttachment) && !isEvidencePending}
              onDelete={attachmentId => {
                if (!onDeleteEditAttachment) return;
                void onDeleteEditAttachment(attachmentId);
              }}
              onDownload={(attachmentId, fileName) => {
                if (!onDownloadEditAttachment) return;
                void onDownloadEditAttachment(attachmentId, fileName);
              }}
            />
          </div>
        </FormField>
        <FormField label="File chứng từ" required={markRequired} error={documentError}>
          <div className={`pending-evidence${documentError ? ' pending-evidence--error' : ''}`}>
            <button
              type="button"
              className={`pending-evidence__zone${isEvidencePending ? ' is-disabled' : ''}`}
              disabled={isEvidencePending || !onUploadEditAttachment}
              onClick={() => evidenceDocInputRef.current?.click()}
            >
              <FileText size={20} aria-hidden />
              <span className="pending-evidence__zone-hint">
                {isEvidencePending ? 'Đang tải…' : 'Chọn file PDF / Word / Excel'}
              </span>
            </button>
            <input
              ref={evidenceDocInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
              multiple
              className="pending-evidence__input"
              disabled={isEvidencePending || !onUploadEditAttachment}
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (!onUploadEditAttachment || files.length === 0) return;
                void (async () => {
                  for (const file of files) await onUploadEditAttachment(file, 'document');
                })();
              }}
            />
            <SavedImportDocList
              attachments={editAttachments}
              canEdit={Boolean(onDeleteEditAttachment) && !isEvidencePending}
              onDelete={attachmentId => {
                if (!onDeleteEditAttachment) return;
                void onDeleteEditAttachment(attachmentId);
              }}
              onDownload={(attachmentId, fileName) => {
                if (!onDownloadEditAttachment) return;
                void onDownloadEditAttachment(attachmentId, fileName);
              }}
            />
          </div>
        </FormField>
      </div>
    </div>
  );
}
