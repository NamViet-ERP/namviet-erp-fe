export function FieldView({ label, value }: { label: string; value?: string }) {
  return (
    <div className="hrm-field">
      <span className="hrm-field__label">{label}</span>
      <span className="hrm-field__value">{value || '—'}</span>
    </div>
  );
}

export function FieldInput({ label, value, onChange, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string;
}) {
  return (
    <div className="hrm-field">
      <label className="hrm-field__label">{label}</label>
      <input
        type={type}
        className={`hrm-field-input ${error ? 'hrm-field-input--error' : ''}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
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
