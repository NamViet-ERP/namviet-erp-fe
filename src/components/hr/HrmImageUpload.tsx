import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { readImageFile, type LocalFileState } from '../../lib/hrm/attachments';

interface HrmImageUploadProps {
  label: string;
  file: LocalFileState | null;
  onFile: (file: LocalFileState) => void;
  onRemove: () => void;
  onError?: (message: string) => void;
  hint?: string;
}

export default function HrmImageUpload({
  label,
  file,
  onFile,
  onRemove,
  onError,
  hint = 'Chọn ảnh (tối đa 5MB)',
}: HrmImageUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  const pick = (picked: File) => {
    readImageFile(picked, onFile, onError);
  };

  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      {!file ? (
        <button type="button" onClick={() => ref.current?.click()} className="hrm-upload-zone w-full">
          <Upload size={20} className="mx-auto mb-1 text-[var(--md-on-surface-variant)]" />
          <span className="text-sm text-[var(--md-on-surface-variant)]">{hint}</span>
        </button>
      ) : (
        <div className="hrm-upload-file">
          {file.preview && <img src={file.preview} alt="" className="w-16 h-16 object-cover rounded-lg" />}
          <span className="text-sm flex-1 truncate text-[var(--md-on-surface)]">{file.file.name}</span>
          <button
            type="button"
            onClick={onRemove}
            className="text-[var(--md-error)] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[var(--md-error-container)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && pick(e.target.files[0])}
      />
    </div>
  );
}

export type { LocalFileState };
