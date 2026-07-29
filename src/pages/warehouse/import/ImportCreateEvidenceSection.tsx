import { FileText, Upload } from 'lucide-react';
import type { ImportAttachment } from '../../../types';
import FormField from '../../../components/ui/FormField';
import {
  PendingDocList,
  PendingPhotoGrid,
  SavedImportDocList,
  SavedImportPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';

export interface ImportCreateEvidenceSectionProps {
  isCreateMode: boolean;
  evaluationDraft: string;
  onEvaluationChange: (value: string) => void;
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
  evaluationDraft,
  onEvaluationChange,
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
  if (isCreateMode) {
    return (
      <div className="space-y-3">
        <FormField label="Đánh giá nhận hàng">
          <textarea
            className="form-input pending-evidence-note"
            rows={3}
            value={evaluationDraft}
            onChange={e => onEvaluationChange(e.target.value)}
            placeholder="Mô tả tình trạng hàng khi nhận…"
          />
        </FormField>
        <p className="text-[11px] text-[var(--md-on-surface-variant)] -mt-1 text-pretty">
          Có thể đính kèm ngay khi tạo. Duyệt thực tế bắt buộc có đánh giá + ảnh + file chứng từ.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="pending-evidence">
            <div className="pending-evidence__title">Ảnh nhận hàng</div>
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
          <div className="pending-evidence">
            <div className="pending-evidence__title">File chứng từ</div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormField label="Đánh giá nhận hàng">
        <textarea
          className="form-input pending-evidence-note"
          rows={3}
          value={evaluationDraft}
          onChange={e => onEvaluationChange(e.target.value)}
          placeholder="Mô tả tình trạng hàng khi nhận…"
          disabled={isEvidencePending}
        />
      </FormField>
      <p className="text-[11px] text-[var(--md-on-surface-variant)] text-pretty">
        Thêm / xóa ảnh và file chứng từ tại đây. Màn chi tiết chỉ xem.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="pending-evidence">
          <div className="pending-evidence__title">Ảnh nhận hàng</div>
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
        <div className="pending-evidence">
          <div className="pending-evidence__title">File chứng từ</div>
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
      </div>
    </div>
  );
}
