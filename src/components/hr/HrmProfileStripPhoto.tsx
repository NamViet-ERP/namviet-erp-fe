import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import HrmProfileAvatar from './HrmProfileAvatar';
import { readProfileImageFile, type LocalFileState } from '../../lib/hrm/attachments';
import { useSecureFileUrl } from '../../hooks/useSecureFileUrl';

type HrmProfileStripPhotoProps = {
  name: string;
  photoUrl?: string;
  pending: LocalFileState | null;
  isEditing: boolean;
  onFile: (file: LocalFileState) => void;
  onRemove: () => void;
  onError?: (message: string) => void;
};

export default function HrmProfileStripPhoto({
  name,
  photoUrl,
  pending,
  isEditing,
  onFile,
  onRemove,
  onError,
}: HrmProfileStripPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = pending?.preview ?? photoUrl;
  const securePreview = useSecureFileUrl(preview);
  const [brokenUrl, setBrokenUrl] = useState<string | undefined>();
  const hasPreview = !!securePreview.url && brokenUrl !== securePreview.url;

  const openPicker = () => inputRef.current?.click();

  const pickFile = (picked: File) => {
    void readProfileImageFile(picked, onFile, onError);
  };

  return (
    <div className="hrm-profile-strip__photo">
      <div
        className={`hrm-profile-strip__photo-frame${isEditing ? ' hrm-profile-strip__photo-frame--editable' : ''}`}
      >
        {isEditing ? (
          hasPreview ? (
            <>
              <button
                type="button"
                className="hrm-profile-strip__photo-picker"
                onClick={openPicker}
                aria-label="Chọn ảnh hồ sơ"
              >
                <img
                  key={securePreview.url}
                  src={securePreview.url}
                  alt=""
                  className="hrm-profile-strip__photo-img"
                  onError={() => {
                    setBrokenUrl(securePreview.url);
                    if (photoUrl && !pending) onRemove();
                  }}
                />
                <span className="hrm-profile-strip__photo-overlay" aria-hidden>
                  <Camera size={18} />
                </span>
              </button>
              <button
                type="button"
                className="hrm-profile-strip__photo-remove"
                onClick={onRemove}
                aria-label="Xóa ảnh hồ sơ"
              >
                <X size={14} aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="hrm-profile-strip__photo-empty"
              onClick={openPicker}
              aria-label="Chọn ảnh hồ sơ"
            >
              <Upload size={20} aria-hidden />
              <span>Chọn ảnh</span>
            </button>
          )
        ) : (
          <HrmProfileAvatar name={name} photoUrl={photoUrl} variant="profile" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const picked = e.target.files?.[0];
          if (picked) pickFile(picked);
          e.target.value = '';
        }}
      />
    </div>
  );
}
