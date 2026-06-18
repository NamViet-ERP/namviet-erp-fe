import { useRef, useState } from 'react';
import { Eye, EyeOff, ImageIcon } from 'lucide-react';
import HrmDatePicker from './HrmDatePicker';
import HrmImageUpload, { type LocalFileState } from './HrmImageUpload';
import { maskSensitiveId } from '../../lib/hrm/formatters';
import { readImageFile } from '../../lib/hrm/attachments';
import type { FileAttachment } from '../../types/hr';

export function FieldView({ label, value }: { label: string; value?: string }) {
  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      <span className="hrm-field__value">{value || '—'}</span>
    </div>
  );
}

/** View-only field that masks sensitive IDs; click eye to reveal. */
export function MaskedFieldView({ label, value }: { label: string; value?: string }) {
  const [revealed, setRevealed] = useState(false);
  const display = value ? (revealed ? value : maskSensitiveId(value)) : '—';

  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      <div className="hrm-field__value-row">
        <span className="hrm-field__value hrm-field__value--mono">{display}</span>
        {value && (
          <button
            type="button"
            className="hrm-reveal-btn"
            onClick={() => setRevealed(v => !v)}
            aria-label={revealed ? `Ẩn ${label}` : `Hiện ${label}`}
            title={revealed ? 'Ẩn' : 'Hiện đầy đủ'}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function FieldInput({ label, value, onChange, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string;
}) {
  return (
    <div className="hrm-field">
      <label className="hrm-field__label">{label}</label>
      {type === 'date' ? (
        <HrmDatePicker value={value} onChange={onChange} error={Boolean(error)} />
      ) : (
        <input
          type={type}
          className={`hrm-field-input ${error ? 'hrm-field-input--error' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {error && <p className="hrm-field__error">{error}</p>}
    </div>
  );
}

export function FieldSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="hrm-field">
      <label className="hrm-field__label">{label}</label>
      <select className="hrm-field-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function ImagePreview({ label, url, fileName, document }: {
  label: string; url?: string; fileName?: string; document?: boolean;
}) {
  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      {url ? (
        <img
          src={url}
          alt={label}
          className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`}
        />
      ) : (
        <span className="hrm-field__value">{fileName || '—'}</span>
      )}
    </div>
  );
}

/** Blurred document preview — requires explicit action to view full image. */
export function SecureImagePreview({ label, url, fileName, document }: {
  label: string; url?: string; fileName?: string; document?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!url) {
    return (
      <div className="hrm-field">
        <span className="hrm-field__label">{label}</span>
        <span className="hrm-field__value">{fileName || '—'}</span>
      </div>
    );
  }

  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      <div className={`hrm-secure-image${revealed ? ' hrm-secure-image--revealed' : ''}`}>
        <img
          src={url}
          alt={label}
          className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`}
        />
        {!revealed && (
          <div className="hrm-secure-image__overlay">
            <ImageIcon size={22} className="text-white/90" aria-hidden />
            <button
              type="button"
              className="hrm-secure-image__reveal-btn"
              onClick={() => setRevealed(true)}
            >
              Xem ảnh
            </button>
          </div>
        )}
        {revealed && (
          <button
            type="button"
            className="hrm-secure-image__hide-btn"
            onClick={() => setRevealed(false)}
          >
            Ẩn ảnh
          </button>
        )}
      </div>
    </div>
  );
}

/** Image field with upload/replace in edit mode. */
export function EditableImageField({
  label,
  attachment,
  pending,
  onFile,
  onRemove,
  document,
  onError,
}: {
  label: string;
  attachment?: FileAttachment;
  pending: LocalFileState | null;
  onFile: (file: LocalFileState) => void;
  onRemove: () => void;
  document?: boolean;
  onError?: (message: string) => void;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const preview = pending?.preview ?? attachment?.previewUrl;

  if (!preview) {
    return (
      <HrmImageUpload
        label={label}
        file={pending}
        onFile={onFile}
        onRemove={onRemove}
        onError={onError}
      />
    );
  }

  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      <div className="hrm-editable-image">
        <img
          src={preview}
          alt={label}
          className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`}
        />
        <div className="hrm-editable-image__actions">
          <button type="button" className="btn btn-outline btn-sm rounded-full" onClick={() => replaceRef.current?.click()}>
            Thay ảnh
          </button>
          <button type="button" className="btn btn-outline btn-sm rounded-full text-[var(--md-error)]" onClick={onRemove}>
            Xóa
          </button>
        </div>
      </div>
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const picked = e.target.files?.[0];
          if (picked) readImageFile(picked, onFile, onError);
          e.target.value = '';
        }}
      />
    </div>
  );
}
