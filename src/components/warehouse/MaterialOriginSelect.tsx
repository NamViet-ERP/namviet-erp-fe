import FormField from '../ui/FormField';
import { useMaterialOrigins } from '../../hooks/useMaterialOrigins';

interface MaterialOriginSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  placeholder?: string;
  /** Giữ hiển thị xuất xứ cũ khi không còn trong danh mục active (chế độ sửa). */
  preserveUnknownValue?: boolean;
  variant?: 'form' | 'hrm';
}

export default function MaterialOriginSelect({
  value,
  onChange,
  error,
  required,
  className,
  selectClassName,
  placeholder = '- Chọn xuất xứ -',
  preserveUnknownValue = false,
  variant = 'form',
}: MaterialOriginSelectProps) {
  const { data: origins = [], isLoading } = useMaterialOrigins(true);
  const safeValue = (value ?? '').trim();
  const showLegacy =
    preserveUnknownValue && safeValue !== '' && !origins.some(o => o.name === safeValue);

  const resolvedSelectClass =
    selectClassName ??
    (variant === 'hrm'
      ? `hrm-field-select${error ? ' hrm-field-input--error' : ''}`
      : 'form-select w-full text-sm');

  const select = (
    <select
      className={resolvedSelectClass}
      value={value ?? ''}
      disabled={isLoading}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {origins.map(o => (
        <option key={o.id} value={o.name}>{o.name}</option>
      ))}
      {showLegacy && <option value={safeValue}>{safeValue}</option>}
    </select>
  );

  if (variant === 'hrm') {
    return (
      <div className={['hrm-field', className].filter(Boolean).join(' ')}>
        <label className="hrm-field__label">
          Xuất xứ
          {required && <span className="text-[var(--md-error)]"> *</span>}
        </label>
        {select}
        {error && <p className="hrm-field__error">{error}</p>}
      </div>
    );
  }

  return (
    <FormField label="Xuất xứ" required={required} error={error} className={className}>
      {select}
    </FormField>
  );
}
