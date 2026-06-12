import { useRef, useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { MAX_HRM_UPLOAD_BYTES } from '../../lib/hrm/attachments';
import { FormFieldError } from './form/FormFields';

const CV_ACCEPT = '.pdf,.doc,.docx';
const CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const CV_EXTENSIONS = ['pdf', 'docx', 'doc'];

interface HrmCvUploadProps {
  label?: string;
  file: File | null;
  fileError?: string | null;
  uploadProgress?: number;
  isUploading?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  onValidationError: (message: string) => void;
}

function isValidCvFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return CV_MIME_TYPES.includes(file.type) || CV_EXTENSIONS.includes(extension || '');
}

export default function HrmCvUpload({
  label = 'File CV *',
  file,
  fileError,
  uploadProgress = 100,
  isUploading = false,
  onFile,
  onRemove,
  onValidationError,
}: HrmCvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateAndPick = (picked: File) => {
    if (!isValidCvFile(picked)) {
      onValidationError('Định dạng file không hỗ trợ. Chỉ nhận file .pdf, .docx, .doc');
      return;
    }
    if (picked.size > MAX_HRM_UPLOAD_BYTES) {
      onValidationError('Dung lượng file vượt quá 5MB');
      return;
    }
    onFile(picked);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) validateAndPick(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="hrm-field__label">{label}</label>
      {!file ? (
        <div
          className={`hrm-upload-zone${dragActive ? ' hrm-upload-zone--active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={CV_ACCEPT}
            className="hidden"
            onChange={e => e.target.files?.[0] && validateAndPick(e.target.files[0])}
          />
          <Upload
            size={36}
            className={`mx-auto mb-3 ${dragActive ? 'text-[var(--md-primary)]' : 'text-[var(--md-on-surface-variant)]'}`}
          />
          <p className="text-sm font-medium text-[var(--md-on-surface)]">
            Kéo thả file CV vào đây hoặc click để duyệt file
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1.5">
            Hỗ trợ .pdf, .docx, .doc (dưới 5MB)
          </p>
        </div>
      ) : (
        <div className="hrm-upload-file">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hrm-upload-file__icon">
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-[var(--md-on-surface)]">{file.name}</p>
              <p className="text-xs text-[var(--md-on-surface-variant)]">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              {(isUploading || uploadProgress < 100) && (
                <div className="hrm-upload-file__progress">
                  <div className="hrm-upload-file__progress-bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-[var(--md-error)] bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-[var(--md-error-container)] transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
      <FormFieldError message={fileError} />
    </div>
  );
}
