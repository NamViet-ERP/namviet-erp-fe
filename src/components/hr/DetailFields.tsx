import { useRef, useState } from 'react';
import { Eye, EyeOff, ImageIcon } from 'lucide-react';
import HrmDatePicker from './HrmDatePicker';
import HrmImageUpload, { type LocalFileState } from './HrmImageUpload';
import { maskSensitiveId } from '../../lib/hrm/formatters';
import { readImageFile } from '../../lib/hrm/attachments';
import type { FileAttachment } from '../../types/hr';
import { useSecureFileUrl } from '../../hooks/useSecureFileUrl';

export function FieldView({ label, value, multiline, className = '' }: { label: string; value?: string; multiline?: boolean; className?: string }) {
  return (
    <div className={`hrm-field ${className}`.trim()}>
      <span className="hrm-field__label">{label}</span>
      <span className={`hrm-field__value${multiline ? ' hrm-field__value--multiline' : ''}`}>{value || '—'}</span>
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

import HrmSelect from './HrmSelect';
import { sanitizePhoneField, trimFieldValue } from '../../lib/hrm/sanitizeInput';

export function FieldInput({ label, value, onChange, type = 'text', error, phone, trimOnBlur = true, placeholder, hint, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string;
  phone?: boolean; trimOnBlur?: boolean; placeholder?: string; hint?: string; className?: string;
}) {
  const handleBlur = () => {
    if (type === 'date') return;
    let next = value;
    if (phone) next = sanitizePhoneField(value);
    else if (trimOnBlur) next = trimFieldValue(value);
    if (next !== value) onChange(next);
  };

  return (
    <div className={`hrm-field ${className}`.trim()}>
      <label className="hrm-field__label">{label}</label>
      {hint && (
        <p className="text-[10px] text-[var(--md-on-surface-variant)] -mt-0.5 mb-1 leading-snug">{hint}</p>
      )}
      {type === 'date' ? (
        <HrmDatePicker value={value} onChange={onChange} error={Boolean(error)} />
      ) : (
        <input
          type={phone ? 'tel' : type}
          className={`hrm-field-input ${error ? 'hrm-field-input--error' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
      )}
      {error && <p className="hrm-field__error">{error}</p>}
    </div>
  );
}

export function FieldTextarea({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`hrm-field ${className}`.trim()}>
      <label className="hrm-field__label">{label}</label>
      <textarea
        className={`form-input w-full${error ? ' hrm-field-input--error' : ''}`}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="hrm-field__error">{error}</p>}
    </div>
  );
}

export function FieldSelect({ label, value, onChange, options, placeholder = '—' }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="hrm-field">
      <label className="hrm-field__label">{label}</label>
      <HrmSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ImagePreview({ label, url, fileName, document }: {
  label: string; url?: string; fileName?: string; document?: boolean;
}) {
  const secureImage = useSecureFileUrl(url, fileName);
  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      {secureImage.url ? (
        <img
          src={secureImage.url}
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
  const secureImage = useSecureFileUrl(url, fileName);

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
        {secureImage.url ? (
          <img
            src={secureImage.url}
            alt={label}
            className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`}
          />
        ) : (
          <div className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`} role="status">
            {secureImage.error ? 'Không thể tải ảnh' : 'Đang tải ảnh...'}
          </div>
        )}
        {!revealed && (
          <div className="hrm-secure-image__overlay">
            <ImageIcon size={22} className="hrm-secure-image__overlay-icon" aria-hidden />
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
  const securePreview = useSecureFileUrl(preview, attachment?.fileName);
  const [brokenUrl, setBrokenUrl] = useState<string | undefined>();

  if (!preview || brokenUrl === securePreview.url || securePreview.error) {
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
        {securePreview.url ? (
          <img
          key={securePreview.url}
          src={securePreview.url}
          alt={label}
          className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`}
          onError={() => {
            setBrokenUrl(securePreview.url);
            if (attachment?.previewUrl && !pending) onRemove();
          }}
        />
        ) : (
          <div className={`hrm-field-image${document ? ' hrm-field-image--document' : ''}`} role="status">
            Đang tải ảnh...
          </div>
        )}
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
