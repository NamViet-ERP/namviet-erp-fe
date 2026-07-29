import { useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import {
  PendingDocList,
  PendingPhotoGrid,
} from '../../../components/warehouse/PendingLocalEvidence';

interface DefectCreateEvidenceFieldsProps {
  photoFiles: File[];
  docFiles: File[];
  onPhotoFilesChange: (updater: (prev: File[]) => File[]) => void;
  onDocFilesChange: (updater: (prev: File[]) => File[]) => void;
}

export default function DefectCreateEvidenceFields({
  photoFiles,
  docFiles,
  onPhotoFilesChange,
  onDocFilesChange,
}: DefectCreateEvidenceFieldsProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="pending-evidence">
        <div className="pending-evidence__title">Ảnh hàng lỗi</div>
        <p className="pending-evidence__hint">Gửi duyệt bắt buộc ≥1 ảnh.</p>
        <button
          type="button"
          className="pending-evidence__zone"
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload size={20} aria-hidden />
          <span className="pending-evidence__zone-hint">Chọn ảnh (có thể chọn nhiều)</span>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="pending-evidence__input"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onPhotoFilesChange(prev => [...prev, ...files]);
            e.target.value = '';
          }}
        />
        <PendingPhotoGrid
          files={photoFiles}
          onRemove={idx => onPhotoFilesChange(prev => prev.filter((_, i) => i !== idx))}
        />
      </div>

      <div className="pending-evidence">
        <div className="pending-evidence__title">File chứng từ</div>
        <p className="pending-evidence__hint">PDF / Word / Excel — tuỳ chọn.</p>
        <button
          type="button"
          className="pending-evidence__zone"
          onClick={() => docInputRef.current?.click()}
        >
          <FileText size={20} aria-hidden />
          <span className="pending-evidence__zone-hint">Chọn file PDF / Word / Excel</span>
        </button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
          multiple
          className="pending-evidence__input"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onDocFilesChange(prev => [...prev, ...files]);
            e.target.value = '';
          }}
        />
        <PendingDocList
          files={docFiles}
          onRemove={idx => onDocFilesChange(prev => prev.filter((_, i) => i !== idx))}
        />
      </div>
    </div>
  );
}
