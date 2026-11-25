import { useRef } from 'react';
import type React from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { showToast } from '../../../components/ui/Toast';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export interface MaterialImageFieldProps {
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  label?: string;
  hint?: string;
  variant?: 'form' | 'hrm';
  className?: string;
}

export default function MaterialImageField({
  previewUrl,
  onSelectFile,
  onRemove,
  label = 'Hình ảnh vật tư',
  hint = 'Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Kích thước tối đa 10MB.',
  variant = 'form',
  className = '',
}: MaterialImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('warning', 'Kích thước ảnh tối đa là 10MB');
      return;
    }
    onSelectFile(file);
  };

  const labelClass = variant === 'hrm'
    ? 'hrm-field__label block mb-1.5 font-medium'
    : 'hrm-label block mb-1.5 font-medium';

  return (
    <div className={['border-t border-[var(--color-border)] pt-3', className].filter(Boolean).join(' ')}>
      <span className={labelClass}>{label}</span>
      <div className="mat-image-dropzone">
        {previewUrl ? (
          <div className="mat-image-preview">
            <img
              src={previewUrl}
              alt="Xem trước ảnh vật tư"
              className="mat-image-preview__img"
            />
            <button
              type="button"
              onClick={onRemove}
              className="mat-image-preview__overlay"
              title="Xóa ảnh"
            >
              <Trash2 size={16} aria-hidden />
              Xóa
            </button>
          </div>
        ) : (
          <div className="mat-image-placeholder">
            <ImageIcon size={28} className="opacity-40" aria-hidden />
            <span>Chưa có ảnh</span>
          </div>
        )}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outlined"
              size="sm"
              leftIcon={Upload}
              onClick={() => inputRef.current?.click()}
            >
              {previewUrl ? 'Đổi ảnh khác' : 'Chọn ảnh tải lên'}
            </Button>
            {previewUrl ? (
              <Button
                type="button"
                variant="text"
                size="sm"
                leftIcon={Trash2}
                className="mat-image-remove-btn"
                onClick={onRemove}
              >
                Gỡ ảnh
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
        </div>
      </div>
    </div>
  );
}
